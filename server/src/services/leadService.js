import { db } from '../db/database.js';
import { cleanNullable, cleanEmail, cleanUrl, jsonParse, jsonString } from '../utils/sanitize.js';
import { nowIso } from '../utils/time.js';
import { normalizePhone, validateWhatsAppNumber, getUserDefaultCountry } from './whatsappService.js';
import { scoreLead as aiScoreLead, analyzeCompany } from './aiService.js';

function rowToLead(row) {
  if (!row) return null;
  return {
    ...row,
    score_reasons: jsonParse(row.score_reasons, []),
    social_links: jsonParse(row.social_links, []),
    raw_data: jsonParse(row.raw_data, null),
    analysis: jsonParse(row.analysis, row.analysis || null)
  };
}

export function listLeads(userId, { q = '', label = '', source = '', limit = 100, offset = 0, scrapeJobId = null } = {}) {
  const clauses = ['user_id = @userId'];
  const params = { userId, q: `%${q}%`, label, source, limit: Number(limit), offset: Number(offset), scrapeJobId };
  if (q) clauses.push('(name LIKE @q OR company LIKE @q OR email LIKE @q OR website LIKE @q OR industry LIKE @q)');
  if (label) clauses.push('score_label = @label');
  if (source) clauses.push('source = @source');
  if (scrapeJobId) clauses.push('scrape_job_id = @scrapeJobId');
  const where = clauses.join(' AND ');
  const rows = db.prepare(`SELECT * FROM leads WHERE ${where} ORDER BY score DESC, updated_at DESC LIMIT @limit OFFSET @offset`).all(params);
  const total = db.prepare(`SELECT COUNT(*) as count FROM leads WHERE ${where}`).get(params).count;
  return { rows: rows.map(rowToLead), total };
}

export function getLead(userId, id) {
  return rowToLead(db.prepare('SELECT * FROM leads WHERE user_id = ? AND id = ?').get(userId, id));
}

export async function createLead(userId, payload, { score = true, analyze = true, scrapeJobId = null } = {}) {
  const defaultCountry = getUserDefaultCountry(userId);
  const phoneNorm = payload.phone ? normalizePhone(payload.phone, defaultCountry) : null;
  const website = cleanUrl(payload.website);
  const email = cleanEmail(payload.email);
  let analysis = payload.analysis || null;
  let industry = cleanNullable(payload.industry, 120);

  if (analyze && (website || payload.rawText || payload.company || payload.name)) {
    const analyzed = await analyzeCompany(userId, {
      name: payload.name,
      company: payload.company,
      website,
      email,
      text: payload.rawText || payload.text || ''
    });
    analysis = analyzed;
    if (!industry) industry = analyzed.industry;
  }

  const base = {
    user_id: userId,
    scrape_job_id: scrapeJobId,
    name: cleanNullable(payload.name, 200) || cleanNullable(payload.company, 200) || 'Unknown Lead',
    title: cleanNullable(payload.title, 160),
    company: cleanNullable(payload.company, 200) || cleanNullable(payload.name, 200),
    email,
    phone: cleanNullable(payload.phone, 80),
    normalized_phone: phoneNorm?.valid ? phoneNorm.normalized : null,
    website,
    industry,
    location: cleanNullable(payload.location, 180),
    source: cleanNullable(payload.source, 50) || 'manual',
    status: cleanNullable(payload.status, 40) || 'new',
    whatsapp_status: 'unknown',
    whatsapp_link: null,
    analysis: jsonString(analysis),
    social_links: jsonString(payload.social_links || payload.socialLinks || []),
    raw_data: jsonString(payload.raw_data || payload.rawData || payload),
    score: 0,
    score_label: 'Cold',
    score_reasons: jsonString([]),
    last_scored_at: null,
    created_at: nowIso(),
    updated_at: nowIso()
  };

  if (base.phone) {
    const wa = await validateWhatsAppNumber(userId, base.phone);
    base.whatsapp_status = wa.status;
    base.whatsapp_link = wa.waLink;
  }

  if (score) {
    const scored = await aiScoreLead(userId, { ...base, rawText: payload.rawText || '' });
    base.score = scored.score;
    base.score_label = scored.label;
    base.score_reasons = jsonString(scored.breakdown);
    base.last_scored_at = nowIso();
  }

  const insert = db.prepare(`INSERT INTO leads (
      user_id, scrape_job_id, name, title, company, email, phone, normalized_phone, website, industry, location, source, status,
      score, score_label, score_reasons, whatsapp_status, whatsapp_link, analysis, social_links, raw_data, last_scored_at, created_at, updated_at
    ) VALUES (
      @user_id, @scrape_job_id, @name, @title, @company, @email, @phone, @normalized_phone, @website, @industry, @location, @source, @status,
      @score, @score_label, @score_reasons, @whatsapp_status, @whatsapp_link, @analysis, @social_links, @raw_data, @last_scored_at, @created_at, @updated_at
    )`);

  try {
    const result = insert.run(base);
    return getLead(userId, result.lastInsertRowid);
  } catch (error) {
    if (String(error.message).includes('UNIQUE')) {
      const existing = email
        ? db.prepare('SELECT id FROM leads WHERE user_id = ? AND email = ?').get(userId, email)
        : db.prepare('SELECT id FROM leads WHERE user_id = ? AND website = ?').get(userId, website);
      if (existing) return updateLead(userId, existing.id, base, { rescore: score });
    }
    throw error;
  }
}

export async function updateLead(userId, id, payload, { rescore = false } = {}) {
  const current = getLead(userId, id);
  if (!current) return null;
  const updated = {
    name: cleanNullable(payload.name ?? current.name, 200) || current.name,
    title: cleanNullable(payload.title ?? current.title, 160),
    company: cleanNullable(payload.company ?? current.company, 200),
    email: payload.email !== undefined ? cleanEmail(payload.email) : current.email,
    phone: cleanNullable(payload.phone ?? current.phone, 80),
    website: payload.website !== undefined ? cleanUrl(payload.website) : current.website,
    industry: cleanNullable(payload.industry ?? current.industry, 120),
    location: cleanNullable(payload.location ?? current.location, 180),
    source: cleanNullable(payload.source ?? current.source, 50) || 'manual',
    status: cleanNullable(payload.status ?? current.status, 40) || 'new',
    social_links: jsonString(payload.social_links ?? payload.socialLinks ?? current.social_links ?? []),
    raw_data: jsonString(payload.raw_data ?? payload.rawData ?? current.raw_data ?? null),
    analysis: typeof payload.analysis === 'object' ? jsonString(payload.analysis) : (payload.analysis ?? (typeof current.analysis === 'object' ? jsonString(current.analysis) : current.analysis)),
    updated_at: nowIso(),
    normalized_phone: current.normalized_phone,
    whatsapp_status: current.whatsapp_status,
    whatsapp_link: current.whatsapp_link,
    score: current.score,
    score_label: current.score_label,
    score_reasons: jsonString(current.score_reasons || []),
    last_scored_at: current.last_scored_at
  };

  if (updated.phone && updated.phone !== current.phone) {
    const phoneNorm = normalizePhone(updated.phone, getUserDefaultCountry(userId));
    updated.normalized_phone = phoneNorm.valid ? phoneNorm.normalized : null;
    const wa = await validateWhatsAppNumber(userId, updated.phone);
    updated.whatsapp_status = wa.status;
    updated.whatsapp_link = wa.waLink;
  }

  if (rescore) {
    const scored = await aiScoreLead(userId, updated);
    updated.score = scored.score;
    updated.score_label = scored.label;
    updated.score_reasons = jsonString(scored.breakdown);
    updated.last_scored_at = nowIso();
  }

  db.prepare(`UPDATE leads SET
    name=@name, title=@title, company=@company, email=@email, phone=@phone, normalized_phone=@normalized_phone, website=@website,
    industry=@industry, location=@location, source=@source, status=@status, score=@score, score_label=@score_label,
    score_reasons=@score_reasons, whatsapp_status=@whatsapp_status, whatsapp_link=@whatsapp_link, analysis=@analysis,
    social_links=@social_links, raw_data=@raw_data, last_scored_at=@last_scored_at, updated_at=@updated_at
    WHERE user_id = @userId AND id = @id`).run({ ...updated, userId, id });
  return getLead(userId, id);
}

export async function rescoreLead(userId, id) {
  const lead = getLead(userId, id);
  if (!lead) return null;
  const scored = await aiScoreLead(userId, lead);
  db.prepare(`UPDATE leads SET score = ?, score_label = ?, score_reasons = ?, last_scored_at = ?, updated_at = ? WHERE user_id = ? AND id = ?`)
    .run(scored.score, scored.label, jsonString(scored.breakdown), nowIso(), nowIso(), userId, id);
  return { ...getLead(userId, id), scoring: scored };
}

export function deleteLead(userId, id) {
  const result = db.prepare('DELETE FROM leads WHERE user_id = ? AND id = ?').run(userId, id);
  return result.changes > 0;
}

export function dashboardSummary(userId) {
  const totals = db.prepare(`SELECT COUNT(*) as total, AVG(score) as avgScore FROM leads WHERE user_id = ?`).get(userId);
  const distribution = db.prepare(`SELECT score_label as label, COUNT(*) as count FROM leads WHERE user_id = ? GROUP BY score_label`).all(userId);
  const recentLeads = db.prepare(`SELECT * FROM leads WHERE user_id = ? ORDER BY created_at DESC LIMIT 8`).all(userId).map(rowToLead);
  const campaigns = db.prepare(`SELECT id, name, channel, status, created_at, updated_at, stats FROM campaigns WHERE user_id = ? ORDER BY updated_at DESC LIMIT 8`).all(userId)
    .map((row) => ({ ...row, stats: jsonParse(row.stats, {}) }));
  const sourceStats = db.prepare(`SELECT source, COUNT(*) as count FROM leads WHERE user_id = ? GROUP BY source`).all(userId);

  let emailsSent = 0, emailsOpened = 0, emailsReplied = 0;
  try {
    const emailStats = db.prepare(`SELECT
      COUNT(*) as sent,
      SUM(CASE WHEN opened_at IS NOT NULL THEN 1 ELSE 0 END) as opened,
      SUM(CASE WHEN replied_at IS NOT NULL THEN 1 ELSE 0 END) as replied
      FROM email_logs WHERE user_id = ? AND status = 'sent'`).get(userId);
    emailsSent = emailStats?.sent || 0;
    emailsOpened = emailStats?.opened || 0;
    emailsReplied = emailStats?.replied || 0;
  } catch {}

  return { totalLeads: totals.total || 0, avgScore: Math.round(totals.avgScore || 0), distribution, recentLeads, campaigns, sourceStats, emailsSent, emailsOpened, emailsReplied };
}
