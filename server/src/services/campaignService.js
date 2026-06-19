import { db } from '../db/database.js';
import { nowIso, sleep } from '../utils/time.js';
import { jsonParse, jsonString, cleanNullable } from '../utils/sanitize.js';
import { getLead } from './leadService.js';
import { generateMessage } from './aiService.js';
import { sendEmail } from './emailService.js';
import { sendWhatsApp } from './whatsappService.js';

function campaignRow(row) {
  if (!row) return null;
  return { ...row, stats: jsonParse(row.stats, {}) };
}

export function listCampaigns(userId) {
  return db.prepare(`SELECT * FROM campaigns WHERE user_id = ? ORDER BY updated_at DESC`).all(userId).map(campaignRow);
}

export function createCampaign(userId, payload) {
  const result = db.prepare(`INSERT INTO campaigns (user_id, name, channel, status, tone, subject, template, stats, created_at, updated_at)
    VALUES (?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?)`).run(
      userId,
      cleanNullable(payload.name, 160) || 'Untitled Campaign',
      cleanNullable(payload.channel, 30) || 'email',
      cleanNullable(payload.tone, 60) || 'friendly',
      cleanNullable(payload.subject, 200),
      cleanNullable(payload.template, 4000),
      jsonString({ queued: 0, sent: 0, failed: 0, skipped: 0 }),
      nowIso(),
      nowIso()
    );
  return getCampaign(userId, result.lastInsertRowid);
}

export function getCampaign(userId, id) {
  const campaign = campaignRow(db.prepare('SELECT * FROM campaigns WHERE user_id = ? AND id = ?').get(userId, id));
  if (!campaign) return null;
  const leads = db.prepare(`SELECT cl.*, l.name, l.company, l.email, l.phone, l.score, l.score_label, l.website, l.whatsapp_status
    FROM campaign_leads cl JOIN leads l ON l.id = cl.lead_id WHERE cl.campaign_id = ? ORDER BY cl.created_at DESC`).all(id);
  return { ...campaign, leads };
}

export function addLeadsToCampaign(userId, campaignId, leadIds = []) {
  const campaign = getCampaign(userId, campaignId);
  if (!campaign) return null;
  const insert = db.prepare(`INSERT OR IGNORE INTO campaign_leads (campaign_id, lead_id, status, created_at) VALUES (?, ?, 'queued', ?)`);
  let added = 0;
  for (const leadId of leadIds) {
    const lead = getLead(userId, leadId);
    if (lead) added += insert.run(campaignId, leadId, nowIso()).changes;
  }
  const queued = db.prepare(`SELECT COUNT(*) as count FROM campaign_leads WHERE campaign_id = ?`).get(campaignId).count;
  const stats = { ...(campaign.stats || {}), queued };
  db.prepare(`UPDATE campaigns SET stats = ?, updated_at = ? WHERE id = ?`).run(jsonString(stats), nowIso(), campaignId);
  return { campaign: getCampaign(userId, campaignId), added };
}

function renderTemplate(template, lead, message) {
  if (!template) return message.message;
  return template
    .replace(/{{\s*name\s*}}/gi, lead.name || '')
    .replace(/{{\s*firstName\s*}}/gi, (lead.name || '').split(' ')[0] || '')
    .replace(/{{\s*company\s*}}/gi, lead.company || lead.name || '')
    .replace(/{{\s*website\s*}}/gi, lead.website || '')
    .replace(/{{\s*industry\s*}}/gi, lead.industry || '')
    .replace(/{{\s*aiMessage\s*}}/gi, message.message || '');
}

async function runCampaignJob(userId, campaignId, options = {}) {
  const campaign = getCampaign(userId, campaignId);
  if (!campaign) return;
  db.prepare(`UPDATE campaigns SET status = 'running', updated_at = ? WHERE id = ?`).run(nowIso(), campaignId);
  const rows = db.prepare(`SELECT cl.id as campaign_lead_id, l.* FROM campaign_leads cl JOIN leads l ON l.id = cl.lead_id WHERE cl.campaign_id = ?`).all(campaignId);
  const stats = { queued: rows.length, sent: 0, failed: 0, skipped: 0 };
  const delayMs = Number(options.delayMs || 2500);

  for (const lead of rows) {
    try {
      const ai = await generateMessage(userId, { lead, tone: options.tone || campaign.tone, channel: campaign.channel, offer: options.offer || '' });
      const body = renderTemplate(campaign.template, lead, ai);
      const subject = campaign.subject || ai.subject || `Quick idea for ${lead.company || lead.name}`;
      db.prepare(`UPDATE campaign_leads SET personalized_message = ?, subject = ?, status = 'generated' WHERE id = ?`).run(body, subject, lead.campaign_lead_id);

      let result;
      if (campaign.channel === 'email') {
        if (!lead.email) {
          stats.skipped += 1;
          db.prepare(`UPDATE campaign_leads SET status = 'skipped', error = 'Lead has no email' WHERE id = ?`).run(lead.campaign_lead_id);
          continue;
        }
        result = await sendEmail({ userId, leadId: lead.id, campaignId, to: lead.email, subject, text: body });
      } else if (campaign.channel === 'whatsapp') {
        if (!lead.phone && !lead.normalized_phone) {
          stats.skipped += 1;
          db.prepare(`UPDATE campaign_leads SET status = 'skipped', error = 'Lead has no phone' WHERE id = ?`).run(lead.campaign_lead_id);
          continue;
        }
        result = await sendWhatsApp({ userId, leadId: lead.id, campaignId, phone: lead.normalized_phone || lead.phone, message: ai.whatsappMessage || body });
      } else {
        // multi-channel: email first if available, WhatsApp link/API second if phone available.
        const results = [];
        if (lead.email) results.push(await sendEmail({ userId, leadId: lead.id, campaignId, to: lead.email, subject, text: body }));
        if (lead.phone || lead.normalized_phone) results.push(await sendWhatsApp({ userId, leadId: lead.id, campaignId, phone: lead.normalized_phone || lead.phone, message: ai.whatsappMessage || body }));
        result = { sent: results.some((r) => r.sent || r.status === 'link_generated'), status: results.map((r) => r.status).join(',') || 'skipped', results };
      }

      if (result.sent || result.status === 'link_generated') {
        stats.sent += 1;
        db.prepare(`UPDATE campaign_leads SET status = ?, sent_at = ? WHERE id = ?`).run(result.status, nowIso(), lead.campaign_lead_id);
      } else {
        stats.failed += 1;
        db.prepare(`UPDATE campaign_leads SET status = 'failed', error = ? WHERE id = ?`).run(typeof result.error === 'string' ? result.error : JSON.stringify(result.error || result), lead.campaign_lead_id);
      }
      db.prepare(`UPDATE campaigns SET stats = ?, updated_at = ? WHERE id = ?`).run(jsonString(stats), nowIso(), campaignId);
      await sleep(delayMs);
    } catch (error) {
      stats.failed += 1;
      db.prepare(`UPDATE campaign_leads SET status = 'failed', error = ? WHERE id = ?`).run(error.message, lead.campaign_lead_id);
    }
  }
  db.prepare(`UPDATE campaigns SET status = 'completed', stats = ?, updated_at = ? WHERE id = ?`).run(jsonString(stats), nowIso(), campaignId);
}

export function runCampaign(userId, campaignId, options = {}) {
  const campaign = getCampaign(userId, campaignId);
  if (!campaign) return null;
  db.prepare(`UPDATE campaigns SET status = 'queued', updated_at = ? WHERE id = ?`).run(nowIso(), campaignId);
  setImmediate(() => runCampaignJob(userId, campaignId, options).catch((error) => {
    db.prepare(`UPDATE campaigns SET status = 'failed', stats = ?, updated_at = ? WHERE id = ?`).run(jsonString({ error: error.message }), nowIso(), campaignId);
  }));
  return getCampaign(userId, campaignId);
}
