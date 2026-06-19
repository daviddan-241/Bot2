import axios from 'axios';
import { env } from '../config/env.js';
import { db } from '../db/database.js';
import { hashObject } from '../utils/crypto.js';
import { jsonParse, jsonString, cleanText } from '../utils/sanitize.js';
import { ruleScoreLead, inferIndustryFromText, labelForScore } from './leadScoringService.js';
import { getConnection, configured } from './connectionService.js';

function extractJson(text) {
  if (!text) return null;
  const trimmed = text.trim();
  try { return JSON.parse(trimmed); } catch {}
  const match = trimmed.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch {}
  }
  return null;
}

function aiConfig(userId) {
  const cfg = userId ? (getConnection(userId, 'ai') || {}) : {};
  return {
    ollamaUrl: cfg.ollamaUrl || env.ollamaUrl,
    ollamaModel: cfg.ollamaModel || env.ollamaModel,
    groqApiKey: cfg.groqApiKey || env.groqApiKey,
    groqModel: cfg.groqModel || env.groqModel,
    hfApiKey: cfg.hfApiKey || env.hfApiKey,
    hfModel: cfg.hfModel || env.hfModel,
  };
}

async function callOllama(prompt, system = '', cfg = aiConfig()) {
  const response = await axios.post(cfg.ollamaUrl, {
    model: cfg.ollamaModel,
    prompt: system ? `${system}\n\n${prompt}` : prompt,
    stream: false,
    options: { temperature: 0.4 }
  }, { timeout: 45000 });
  const text = response.data?.response;
  if (!text) throw new Error('Ollama returned no text');
  return { provider: `ollama:${cfg.ollamaModel}`, text };
}

async function callGroq(prompt, system = '', cfg = aiConfig()) {
  if (!configured(cfg.groqApiKey)) throw new Error('Groq API key not configured');
  const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
    model: cfg.groqModel,
    messages: [
      { role: 'system', content: system || 'You are LeadFlow AI, a precise B2B CRM assistant.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.35,
    max_tokens: 900
  }, { headers: { Authorization: `Bearer ${cfg.groqApiKey}`, 'Content-Type': 'application/json' }, timeout: 30000 });
  const text = response.data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('Groq returned no text');
  return { provider: `groq:${cfg.groqModel}`, text };
}

async function callHuggingFace(prompt, system = '', cfg = aiConfig()) {
  if (!configured(cfg.hfApiKey)) throw new Error('HuggingFace API key not configured');
  const response = await axios.post(`https://api-inference.huggingface.co/models/${cfg.hfModel}`, {
    inputs: `${system}\n\n${prompt}`,
    parameters: { max_new_tokens: 700, temperature: 0.4, return_full_text: false }
  }, { headers: { Authorization: `Bearer ${cfg.hfApiKey}`, 'Content-Type': 'application/json' }, timeout: 45000 });
  const data = response.data;
  const text = Array.isArray(data) ? (data[0]?.generated_text || data[0]?.summary_text) : (data.generated_text || data[0]?.generated_text);
  if (!text) throw new Error('HuggingFace returned no text');
  return { provider: `huggingface:${cfg.hfModel}`, text };
}

export async function generateText(prompt, system = '', userId = null) {
  const cfg = aiConfig(userId);
  const errors = [];
  for (const caller of [callOllama, callGroq, callHuggingFace]) {
    try { return await caller(prompt, system, cfg); } catch (error) { errors.push(error.message); }
  }
  const error = new Error(`No AI provider available (${errors.join(' → ')})`);
  error.providerErrors = errors;
  throw error;
}

async function cached(userId, task, input, producer) {
  const inputHash = hashObject(input);
  const cachedRow = db.prepare(`SELECT response_json, provider FROM ai_cache WHERE user_id = ? AND task = ? AND input_hash = ? AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)`).get(userId, task, inputHash);
  if (cachedRow) return { ...jsonParse(cachedRow.response_json, {}), provider: cachedRow.provider, cached: true };
  const produced = await producer();
  db.prepare(`INSERT OR REPLACE INTO ai_cache (user_id, task, input_hash, response_json, provider, created_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`)
    .run(userId, task, inputHash, jsonString(produced), produced.provider || 'rule-based');
  return { ...produced, cached: false };
}

function fallbackMessage(lead, tone = 'friendly', offer = '') {
  const company = lead.company || lead.name || 'your team';
  const firstName = (lead.name || '').split(' ')[0] || 'there';
  const value = offer || 'help you find and convert more qualified customers with less manual work';
  return {
    provider: 'rule-based',
    subject: `${company} growth idea`,
    message: `Hi ${firstName},\n\nI came across ${company}${lead.website ? ` (${lead.website})` : ''} and thought there may be a practical way to ${value}.\n\nWould you be open to a quick conversation this week?\n\nBest,`,
    whatsappMessage: `Hi ${firstName}, I came across ${company} and had a quick idea to ${value}. Open to a short chat this week?`,
    tone
  };
}

export async function generateMessage(userId, { lead, tone = 'friendly', channel = 'email', offer = '' }) {
  return cached(userId, 'generate-message', { lead, tone, channel, offer }, async () => {
    const system = 'You write concise, compliant B2B outreach. Do not use fake facts. Return valid JSON only.';
    const prompt = `Create a personalized ${channel} outreach message. Tone: ${tone}. Offer/context: ${offer || 'AI CRM and outreach automation'}.\nLead JSON: ${JSON.stringify(lead)}\nReturn JSON exactly: {"subject":"...","message":"plain text email body","whatsappMessage":"short WhatsApp message","personalizationNotes":["..."]}`;
    try {
      const { text, provider } = await generateText(prompt, system, userId);
      const parsed = extractJson(text);
      if (!parsed?.message) throw new Error('AI message JSON missing message');
      return { ...parsed, provider };
    } catch {
      return fallbackMessage(lead, tone, offer);
    }
  });
}

export async function scoreLead(userId, lead) {
  return cached(userId, 'score-lead', lead, async () => {
    const rules = ruleScoreLead(lead);
    const system = 'You are a conservative B2B lead scoring analyst. Return valid JSON only.';
    const prompt = `Refine this lead score. Use the rule score as anchor. Score 0-100. Penalize unverifiable/weak data.\nRule score: ${rules.score}\nRule reasons: ${JSON.stringify(rules.reasons)}\nLead: ${JSON.stringify(lead)}\nReturn JSON exactly: {"score":75,"label":"Warm","breakdown":[{"label":"reason","points":10,"type":"positive"}],"summary":"one sentence"}`;
    try {
      const { text, provider } = await generateText(prompt, system, userId);
      const parsed = extractJson(text);
      const score = Math.max(0, Math.min(100, Number(parsed?.score ?? rules.score)));
      const breakdown = Array.isArray(parsed?.breakdown) ? parsed.breakdown : rules.reasons;
      return { provider, score: Math.round(score), label: labelForScore(score), breakdown, summary: cleanText(parsed?.summary || `Lead scored ${labelForScore(score)}.`, 300), rules };
    } catch {
      return { provider: 'rule-based', score: rules.score, label: rules.label, breakdown: rules.reasons, summary: `Rule-based ${rules.label.toLowerCase()} lead score.`, rules };
    }
  });
}

export async function analyzeCompany(userId, input) {
  return cached(userId, 'analyze-company', input, async () => {
    const textBlock = cleanText([input.name, input.company, input.website, input.text, input.email].filter(Boolean).join('\n'), 12000);
    const fallbackIndustry = inferIndustryFromText(textBlock);
    const system = 'You classify companies for a CRM. Return valid JSON only. Never fabricate exact numbers.';
    const prompt = `Analyze this company/website text and infer business type, industry, ideal outreach angle, and risks.\n${textBlock}\nReturn JSON exactly: {"industry":"...","businessType":"...","summary":"...","keywords":["..."],"outreachAngle":"...","confidence":0.7}`;
    try {
      const { text, provider } = await generateText(prompt, system, userId);
      const parsed = extractJson(text);
      if (!parsed?.industry) throw new Error('AI company analysis missing industry');
      return {
        provider,
        industry: cleanText(parsed.industry, 80) || fallbackIndustry,
        businessType: cleanText(parsed.businessType, 120) || fallbackIndustry,
        summary: cleanText(parsed.summary, 600),
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 12).map((k) => cleanText(k, 40)) : [],
        outreachAngle: cleanText(parsed.outreachAngle, 400),
        confidence: Number(parsed.confidence || 0.55)
      };
    } catch {
      return {
        provider: 'rule-based',
        industry: fallbackIndustry,
        businessType: fallbackIndustry,
        summary: `Likely ${fallbackIndustry.toLowerCase()} company based on public text/domain signals.`,
        keywords: [],
        outreachAngle: 'Lead with a concise operational efficiency or customer acquisition value proposition.',
        confidence: 0.45
      };
    }
  });
}

export async function chat(userId, messages = []) {
  const recent = messages.slice(-12).map((m) => `${m.role}: ${m.content}`).join('\n');
  const system = 'You are LeadFlow AI assistant inside a CRM. Help with lead generation, scoring, campaigns, and outreach. Keep advice practical and compliant.';
  try {
    const { text, provider } = await generateText(recent, system, userId);
    return { provider, message: text };
  } catch (error) {
    return { provider: 'rule-based', message: 'AI providers are not available right now. Configure Ollama, Groq, or HuggingFace in Connections. I can still score leads and generate basic templates using rules.', error: error.message };
  }
}

export async function providerHealth(userId = null) {
  const cfg = aiConfig(userId);
  const health = [];
  try {
    await axios.get(cfg.ollamaUrl.replace('/api/generate', '/api/tags'), { timeout: 2000 });
    health.push({ provider: 'Ollama', status: 'online', model: cfg.ollamaModel, source: cfg.ollamaUrl === env.ollamaUrl ? 'env/default' : 'site connection' });
  } catch { health.push({ provider: 'Ollama', status: 'offline', model: cfg.ollamaModel, source: cfg.ollamaUrl === env.ollamaUrl ? 'env/default' : 'site connection' }); }
  health.push({ provider: 'Groq', status: configured(cfg.groqApiKey) ? 'configured' : 'not_configured', model: cfg.groqModel, source: cfg.groqApiKey === env.groqApiKey ? 'env/default' : 'site connection' });
  health.push({ provider: 'HuggingFace', status: configured(cfg.hfApiKey) ? 'configured' : 'not_configured', model: cfg.hfModel, source: cfg.hfApiKey === env.hfApiKey ? 'env/default' : 'site connection' });
  health.push({ provider: 'Rule engine', status: 'online', model: 'deterministic', source: 'built-in' });
  return health;
}
