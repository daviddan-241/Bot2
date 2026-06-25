import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { db } from '../db/database.js';
import { nowIso, sleep } from '../utils/time.js';
import { getConnection, configured } from './connectionService.js';

let queue = Promise.resolve();

function siteEmailConfig(userId) {
  const cfg = userId ? (getConnection(userId, 'email') || {}) : {};
  if (cfg.method === 'gmail_oauth' && configured(cfg.gmailAddress) && configured(cfg.googleClientId) && configured(cfg.googleClientSecret) && configured(cfg.gmailRefreshToken)) {
    return {
      source: 'site:gmail_oauth',
      method: 'gmail_oauth',
      from: cfg.smtpFrom || `FlowAI <${cfg.gmailAddress}>`,
      gmailAddress: cfg.gmailAddress,
      googleClientId: cfg.googleClientId,
      googleClientSecret: cfg.googleClientSecret,
      gmailRefreshToken: cfg.gmailRefreshToken,
      gmailAccessToken: cfg.gmailAccessToken || undefined,
    };
  }
  if (configured(cfg.smtpHost) && configured(cfg.smtpUser) && configured(cfg.smtpPass)) {
    return {
      source: 'site:smtp',
      method: 'smtp',
      host: cfg.smtpHost,
      port: Number(cfg.smtpPort || 587),
      secure: Boolean(cfg.smtpSecure === true || cfg.smtpSecure === 'true'),
      user: cfg.smtpUser,
      pass: cfg.smtpPass,
      from: cfg.smtpFrom || `FlowAI <${cfg.smtpUser}>`,
    };
  }
  if (env.smtpUser && env.smtpPass) {
    return {
      source: 'env:smtp',
      method: 'smtp',
      host: env.smtpHost || 'smtp.gmail.com',
      port: env.smtpPort || 587,
      secure: env.smtpSecure || false,
      user: env.smtpUser,
      pass: env.smtpPass,
      from: env.smtpFrom || `FlowAI <${env.smtpUser}>`,
    };
  }
  return { source: 'none', method: 'none' };
}

function getTransporter(userId) {
  const cfg = siteEmailConfig(userId);
  if (cfg.method === 'gmail_oauth') {
    return {
      cfg,
      transporter: nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: cfg.gmailAddress,
          clientId: cfg.googleClientId,
          clientSecret: cfg.googleClientSecret,
          refreshToken: cfg.gmailRefreshToken,
          accessToken: cfg.gmailAccessToken,
        }
      })
    };
  }
  if (cfg.method === 'smtp') {
    return {
      cfg,
      transporter: nodemailer.createTransport({
        host: cfg.host,
        port: cfg.port,
        secure: cfg.secure,
        auth: { user: cfg.user, pass: cfg.pass }
      })
    };
  }
  return { cfg, transporter: null };
}

function wrapHtml(body = '') {
  const escaped = String(body)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>');
  return `<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111827;line-height:1.6;background:#f8fafc;padding:24px"><div style="max-width:640px;margin:0 auto;background:white;border:1px solid #e5e7eb;border-radius:18px;padding:28px">${escaped}</div></body></html>`;
}

async function sendNow({ userId, leadId = null, campaignId = null, to, subject, html, text }) {
  const log = db.prepare(`INSERT INTO email_logs (user_id, lead_id, campaign_id, to_email, subject, html, text, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'queued', ?)`).run(userId, leadId, campaignId, to, subject, html, text, nowIso());

  const { cfg, transporter } = getTransporter(userId);
  if (!transporter) {
    const error = 'Email is not connected. Open Connections and connect Gmail OAuth or SMTP first.';
    db.prepare(`UPDATE email_logs SET status = 'failed', error = ? WHERE id = ?`).run(error, log.lastInsertRowid);
    return { sent: false, status: 'failed', error, logId: log.lastInsertRowid, source: cfg.source };
  }

  try {
    const info = await transporter.sendMail({
      from: cfg.from,
      to,
      subject,
      html: html || wrapHtml(text),
      text: text || String(html || '').replace(/<[^>]+>/g, ' '),
      disableFileAccess: true,
      disableUrlAccess: true,
    });
    db.prepare(`UPDATE email_logs SET status = 'sent', provider_response = ?, sent_at = ? WHERE id = ?`)
      .run(JSON.stringify({ ...info, source: cfg.source }), nowIso(), log.lastInsertRowid);
    return { sent: true, status: 'sent', providerResponse: info, logId: log.lastInsertRowid, source: cfg.source };
  } catch (error) {
    db.prepare(`UPDATE email_logs SET status = 'failed', error = ? WHERE id = ?`).run(error.message, log.lastInsertRowid);
    return { sent: false, status: 'failed', error: error.message, logId: log.lastInsertRowid, source: cfg.source };
  }
}

export async function sendEmail(payload) {
  return sendNow(payload);
}

export function enqueueEmail(payload, delayMs = env.emailQueueDelayMs) {
  queue = queue.then(async () => {
    await sleep(delayMs);
    return sendNow(payload);
  });
  return queue;
}

export async function bulkEmail({ userId, leads, subject, messageFactory, campaignId = null, delayMs = env.emailQueueDelayMs }) {
  const results = [];
  for (const lead of leads) {
    if (!lead.email) {
      results.push({ leadId: lead.id, status: 'skipped', error: 'Lead has no email' });
      continue;
    }
    const message = await messageFactory(lead);
    const result = await enqueueEmail({
      userId,
      leadId: lead.id,
      campaignId,
      to: lead.email,
      subject: message.subject || subject,
      html: message.html,
      text: message.text || message.message
    }, delayMs);
    results.push({ leadId: lead.id, ...result });
  }
  return results;
}

export function emailHealth(userId) {
  const cfg = siteEmailConfig(userId);
  return {
    connected: cfg.method !== 'none',
    method: cfg.method,
    source: cfg.source,
    from: cfg.from || null,
    queueDelayMs: env.emailQueueDelayMs,
    note: cfg.method === 'none' ? 'Connect Gmail OAuth or SMTP in the Connections page.' : 'Email connection is configured.'
  };
}
