import axios from 'axios';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { env } from '../config/env.js';
import { db } from '../db/database.js';
import { nowIso } from '../utils/time.js';
import { getConnection, configured } from './connectionService.js';

export function getUserDefaultCountry(userId) {
  const workspace = userId ? (getConnection(userId, 'workspace') || {}) : {};
  const country = String(workspace.defaultCountry || env.defaultCountry || 'US').trim().toUpperCase();
  return /^[A-Z]{2}$/.test(country) ? country : 'US';
}

function whatsappConfig(userId) {
  const cfg = userId ? (getConnection(userId, 'whatsapp') || {}) : {};
  return {
    accessToken: cfg.whatsappAccessToken || env.whatsappAccessToken,
    phoneNumberId: cfg.whatsappPhoneNumberId || env.whatsappPhoneNumberId,
    verifyUrl: cfg.whatsappVerifyUrl || env.whatsappVerifyUrl,
    businessNumber: cfg.businessNumber || '',
    source: cfg.whatsappAccessToken ? 'site connection' : (env.whatsappAccessToken ? 'env' : 'none')
  };
}

export function normalizePhone(phone, country = env.defaultCountry) {
  const raw = String(phone || '').trim();
  if (!raw) return { valid: false, normalized: null, reason: 'Phone is empty' };
  const parsed = parsePhoneNumberFromString(raw, country);
  if (!parsed) return { valid: false, normalized: null, reason: 'Could not parse phone number' };
  if (!parsed.isValid()) return { valid: false, normalized: parsed.number, reason: 'Phone number format is invalid' };
  return {
    valid: true,
    normalized: parsed.number,
    national: parsed.formatNational(),
    international: parsed.formatInternational(),
    country: parsed.country,
    type: parsed.getType?.() || 'UNKNOWN'
  };
}

export function waLink(phone, message = '') {
  const normalized = String(phone || '').replace(/\D/g, '');
  const encoded = encodeURIComponent(message || '');
  return normalized ? `https://wa.me/${normalized}${encoded ? `?text=${encoded}` : ''}` : `https://wa.me/?text=${encoded}`;
}

export async function validateWhatsAppNumber(userId, phone, country = null) {
  const formatted = normalizePhone(phone, country || getUserDefaultCountry(userId));
  if (!formatted.valid) {
    return { status: 'invalid', indicator: '🔴', ...formatted, waLink: waLink(phone), reason: formatted.reason };
  }

  const type = formatted.type || '';
  const mobileLikely = ['MOBILE', 'FIXED_LINE_OR_MOBILE', 'PREMIUM_RATE', 'UNKNOWN'].includes(type);
  if (!mobileLikely) {
    return { status: 'invalid', indicator: '🔴', ...formatted, waLink: waLink(formatted.normalized), reason: 'Number does not look mobile-capable' };
  }

  const previousSuccess = db.prepare(`SELECT id FROM whatsapp_logs WHERE user_id = ? AND to_phone = ? AND status = 'sent' LIMIT 1`)
    .get(userId, formatted.normalized);
  if (previousSuccess) {
    return { status: 'verified', indicator: '🟢', ...formatted, waLink: waLink(formatted.normalized), reason: 'Previously delivered through configured WhatsApp API' };
  }

  const cfg = whatsappConfig(userId);
  if (configured(cfg.verifyUrl)) {
    try {
      const response = await axios.post(cfg.verifyUrl, { phone: formatted.normalized }, { timeout: 7000 });
      if (response.data?.valid || response.data?.status === 'verified') {
        return { status: 'verified', indicator: '🟢', ...formatted, waLink: waLink(formatted.normalized), reason: 'Verified by configured WhatsApp validation provider' };
      }
    } catch {
      // Fallback to unknown; validation provider failures must not block outreach links.
    }
  }

  return { status: 'unknown', indicator: '🟡', ...formatted, waLink: waLink(formatted.normalized), reason: 'Valid mobile format; WhatsApp account not confirmed until message delivery succeeds' };
}

export async function sendWhatsApp({ userId, leadId = null, campaignId = null, phone, message }) {
  const cfg = whatsappConfig(userId);
  const validation = await validateWhatsAppNumber(userId, phone);
  const link = waLink(validation.normalized || phone, message);
  const log = db.prepare(`INSERT INTO whatsapp_logs (user_id, lead_id, campaign_id, to_phone, message, status, wa_link, created_at)
    VALUES (?, ?, ?, ?, ?, 'queued', ?, ?)`).run(userId, leadId, campaignId, validation.normalized || phone, message, link, nowIso());

  if (validation.status === 'invalid') {
    db.prepare(`UPDATE whatsapp_logs SET status = 'failed', error = ? WHERE id = ?`).run(validation.reason, log.lastInsertRowid);
    return { sent: false, status: 'invalid', validation, waLink: link, logId: log.lastInsertRowid };
  }

  if (!configured(cfg.accessToken) || !configured(cfg.phoneNumberId)) {
    db.prepare(`UPDATE whatsapp_logs SET status = 'link_generated', sent_at = ? WHERE id = ?`).run(nowIso(), log.lastInsertRowid);
    return { sent: false, status: 'link_generated', validation, waLink: link, logId: log.lastInsertRowid, source: cfg.source, note: 'Official WhatsApp Cloud API is not connected. This is a real click-to-chat link, not a simulated API send.' };
  }

  try {
    const response = await axios.post(
      `https://graph.facebook.com/v20.0/${cfg.phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: String(validation.normalized).replace('+', ''),
        type: 'text',
        text: { preview_url: true, body: message }
      },
      { headers: { Authorization: `Bearer ${cfg.accessToken}`, 'Content-Type': 'application/json' }, timeout: 15000 }
    );
    db.prepare(`UPDATE whatsapp_logs SET status = 'sent', provider_response = ?, sent_at = ? WHERE id = ?`)
      .run(JSON.stringify({ ...response.data, source: cfg.source }), nowIso(), log.lastInsertRowid);
    return { sent: true, status: 'sent', validation: { ...validation, status: 'verified', indicator: '🟢' }, providerResponse: response.data, waLink: link, logId: log.lastInsertRowid, source: cfg.source };
  } catch (error) {
    const details = error.response?.data || { message: error.message };
    db.prepare(`UPDATE whatsapp_logs SET status = 'failed', error = ?, provider_response = ? WHERE id = ?`)
      .run(error.message, JSON.stringify(details), log.lastInsertRowid);
    return { sent: false, status: 'failed', validation, error: details, waLink: link, logId: log.lastInsertRowid, source: cfg.source };
  }
}

export function whatsappHealth(userId) {
  const cfg = whatsappConfig(userId);
  return {
    connected: configured(cfg.accessToken) && configured(cfg.phoneNumberId),
    source: cfg.source,
    businessNumber: cfg.businessNumber || null,
    note: configured(cfg.accessToken) && configured(cfg.phoneNumberId)
      ? 'Official WhatsApp Cloud API is connected.'
      : 'Connect Meta WhatsApp Cloud API in Connections. Without it, LeadFlow creates real wa.me click-to-chat links only.'
  };
}
