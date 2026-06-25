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
  if (match) { try { return JSON.parse(match[0]); } catch {} }
  return null;
}

function aiConfig(userId) {
  const cfg = userId ? (getConnection(userId, 'ai') || {}) : {};
  return {
    ollamaUrl: cfg.ollamaUrl || env.ollamaUrl,
    ollamaModel: cfg.ollamaModel || env.ollamaModel,
    groqApiKey: cfg.groqApiKey || env.groqApiKey,
    groqModel: cfg.groqModel || env.groqModel,
  };
}

async function callGroq(prompt, system = '', cfg = aiConfig()) {
  if (!configured(cfg.groqApiKey)) throw new Error('Groq API key not configured');
  const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
    model: cfg.groqModel,
    messages: [
      { role: 'system', content: system || 'You are FlowAI, a B2B CRM and lead generation assistant.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.35,
    max_tokens: 2048
  }, {
    headers: { Authorization: `Bearer ${cfg.groqApiKey}`, 'Content-Type': 'application/json' },
    timeout: 30000
  });
  const text = response.data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('Groq returned no text');
  return { provider: `groq:${cfg.groqModel}`, text };
}

async function callOllama(prompt, system = '', cfg = aiConfig()) {
  const response = await axios.post(cfg.ollamaUrl, {
    model: cfg.ollamaModel,
    prompt: system ? `${system}\n\n${prompt}` : prompt,
    stream: false,
    options: { temperature: 0.4 }
  }, { timeout: 60000 });
  const text = response.data?.response;
  if (!text) throw new Error('Ollama returned no text');
  return { provider: `ollama:${cfg.ollamaModel}`, text };
}

function ruleGenerateText(prompt, system = '') {
  const p = prompt.toLowerCase();
  const s = system.toLowerCase();

  if ((p.includes('"subject"') || (p.includes('outreach') && p.includes('lead')) || (p.includes('email') && p.includes('json')))) {
    const companyM = prompt.match(/"company"\s*:\s*"([^"]+)"/);
    const nameM = prompt.match(/"name"\s*:\s*"([^"]+)"/);
    const websiteM = prompt.match(/"website"\s*:\s*"([^"]+)"/);
    const company = companyM?.[1] || nameM?.[1] || 'your business';
    const firstName = (nameM?.[1] || '').split(' ')[0] || 'there';
    const site = websiteM?.[1] || '';
    return {
      provider: 'rule-engine',
      text: JSON.stringify({
        subject: `Quick question about ${company}`,
        message: `Hi ${firstName},\n\nI came across ${company}${site ? ` at ${site}` : ''} and wanted to reach out.\n\nWe help businesses like yours attract more qualified clients without paid ads. Would you be open to a quick 10-minute call this week?\n\nBest regards`,
        whatsappMessage: `Hi ${firstName}! I found ${company} and think we could help you get more clients. Open to a quick chat?`,
        personalizationNotes: ['Personalized with company name from lead record']
      })
    };
  }

  if (p.includes('proposal') || (p.includes('business') && p.includes('write')) || s.includes('proposal')) {
    const companyM = prompt.match(/Business:\s*(.+?)(?:\n|$)/i);
    const locationM = prompt.match(/Location:\s*(.+?)(?:\n|$)/i);
    const industryM = prompt.match(/Industry:\s*(.+?)(?:\n|$)/i);
    const company = companyM?.[1]?.trim() || 'your business';
    const location = locationM?.[1]?.trim() || '';
    const industry = industryM?.[1]?.trim() || 'your industry';
    return {
      provider: 'rule-engine',
      text: `Dear ${company} Team,\n\nAfter reviewing your business, we believe there's a strong opportunity to help ${company} grow its customer base in ${location}.\n\nWhat we offer:\n\n1. Lead Generation — Finding qualified prospects who are actively looking for ${industry} services\n2. Automated Outreach — Professional email campaigns that get real responses\n3. CRM & Pipeline Management — Never lose track of a promising lead again\n\nExpected results for businesses like yours: 2-4x more qualified inquiries within 60 days of launch.\n\nNext step: A free 20-minute discovery call to understand your goals and see if we're a fit. Just reply to this email to book a time.\n\nLooking forward to connecting,`
    };
  }

  if (p.includes('score') && (p.includes('json') || p.includes('lead'))) {
    return {
      provider: 'rule-engine',
      text: JSON.stringify({ score: 55, label: 'Warm', breakdown: [{ label: 'Rule-based estimate', points: 55, type: 'neutral' }], summary: 'Score estimated by built-in rule engine.' })
    };
  }

  if (p.includes('follow') && (p.includes('email') || p.includes('follow-up') || p.includes('follow up'))) {
    const subjM = prompt.match(/subject[:\s]+"?([^"\n]+)"?/i);
    const subj = subjM?.[1]?.trim() || 'our conversation';
    return {
      provider: 'rule-engine',
      text: `Hi,\n\nJust following up on my previous message about ${subj}.\n\nI know you're busy — I'll be quick. Would a 10-minute call this week work for you?\n\nBest regards`
    };
  }

  return { provider: 'rule-engine', text: ruleChat(prompt) };
}

function ruleChat(prompt) {
  const p = prompt.toLowerCase();

  if (p.includes('find lead') || p.includes('find client') || p.includes('find business')) {
    return "To find leads, type something like:\n\n\"Find 10 restaurants in California that need a website\"\n\nI'll search real databases (Serper, Brave, OpenStreetMap), score every result with AI, create a campaign, generate proposals for each, and send outreach emails — all automatically.";
  }
  if (p.includes('campaign')) {
    return "To create an outreach campaign, say something like:\n\n\"Find 10 dentists in London and create a campaign\"\n\nI'll find real businesses, score them Hot/Warm/Cold, create the campaign, and queue emails to all hot + warm leads. If you have Gmail set up in Settings, emails send immediately.";
  }
  if (p.includes('email') && (p.includes('send') || p.includes('setup') || p.includes('connect'))) {
    return "To send real emails:\n\n1. Go to Settings (bottom tab)\n2. Under Email, enter:\n   • SMTP host: smtp.gmail.com\n   • SMTP port: 587\n   • Your Gmail address\n   • Gmail App Password (from myaccount.google.com → Security → App Passwords)\n3. Save and test\n\nOr set SMTP_USER and SMTP_PASS in your server environment — it auto-connects.";
  }
  if (p.includes('follow up') || p.includes('follow-up') || p.includes('check repli')) {
    return "To check for replies and send follow-ups, say:\n\n\"Check for replies and follow up\"\n\nI'll find any leads who haven't responded in 3+ days and automatically send them a warm follow-up email.";
  }
  if (p.includes('proposal')) {
    return "To generate proposals for your leads, say:\n\n\"Find 10 plumbers in Houston and generate proposals for all\"\n\nEach proposal is personalized with the business name, location, and industry — and saved to the lead's notes in your CRM.";
  }
  if (p.includes('score') || p.includes('hot') || p.includes('warm') || p.includes('cold')) {
    return "Lead scoring uses AI to rank leads 0-100:\n\n🔥 Hot (70+) — Website, email, and phone present. High urgency signals.\n🌡️ Warm (40-69) — Some contact info. Moderate interest signals.\n❄️ Cold (0-39) — Limited data. Needs more research.\n\nTo rescore all your leads, say: \"Score all my leads\"";
  }
  if (p.includes('groq') || p.includes('api key') || p.includes('ai provider')) {
    return "AI setup (all free):\n\n1. Groq — Best option. Get a free API key at console.groq.com (no credit card). Add it in Settings → AI.\n2. Ollama — Runs 100% offline on your machine. Install at ollama.ai, then set OLLAMA_URL in your env.\n3. Rule engine — Built-in, always works with no setup.\n\nGroq gives you 14,400 free requests per day.";
  }
  if (p.includes('hello') || p.includes('hi ') || p.includes('hey ') || p.includes('help')) {
    return "Hi! I'm FlowAI — your AI-powered lead engine.\n\nHere's what I can do automatically:\n• Find real businesses anywhere in the world\n• Score every lead Hot/Warm/Cold with AI\n• Generate personalized proposals for each\n• Create campaigns and send outreach emails\n• Follow up automatically with non-responders\n\nJust tell me what you need! For example:\n\"Find 10 restaurants in Lagos that need a website and send them emails\"";
  }

  return "I can help you find leads, create campaigns, generate proposals, and send emails — all automatically.\n\nTry saying:\n• \"Find 10 restaurants in California, create campaigns and send emails\"\n• \"Generate proposals for all my hot leads\"\n• \"Check for replies and follow up\"\n\nWhat would you like to do?";
}

export async function generateText(prompt, system = '', userId = null) {
  const cfg = aiConfig(userId);
  const errors = [];
  for (const caller of [callGroq, callOllama]) {
    try { return await caller(prompt, system, cfg); } catch (err) { errors.push(err.message); }
  }
  return ruleGenerateText(prompt, system);
}

async function cached(userId, task, input, producer) {
  const inputHash = hashObject(input);
  const cachedRow = db.prepare(
    `SELECT response_json, provider FROM ai_cache WHERE user_id = ? AND task = ? AND input_hash = ? AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)`
  ).get(userId, task, inputHash);
  if (cachedRow) return { ...jsonParse(cachedRow.response_json, {}), provider: cachedRow.provider, cached: true };
  const produced = await producer();
  db.prepare(
    `INSERT OR REPLACE INTO ai_cache (user_id, task, input_hash, response_json, provider, created_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
  ).run(userId, task, inputHash, jsonString(produced), produced.provider || 'rule-engine');
  return { ...produced, cached: false };
}

export async function generateMessage(userId, { lead, tone = 'friendly', channel = 'email', offer = '' }) {
  return cached(userId, 'generate-message', { lead, tone, channel, offer }, async () => {
    const system = 'You write concise B2B outreach. Return valid JSON only.';
    const prompt = `Create a personalized ${channel} outreach. Tone: ${tone}. Offer: ${offer || 'AI lead generation and outreach automation'}.\nLead: ${JSON.stringify(lead)}\nReturn JSON: {"subject":"...","message":"plain text body","whatsappMessage":"short WhatsApp message","personalizationNotes":["..."]}`;
    const { text, provider } = await generateText(prompt, system, userId);
    const parsed = extractJson(text);
    if (parsed?.message) return { ...parsed, provider };
    const fallback = ruleGenerateText(prompt, system);
    return { ...extractJson(fallback.text), provider: fallback.provider };
  });
}

export async function scoreLead(userId, lead) {
  return cached(userId, 'score-lead', lead, async () => {
    const rules = ruleScoreLead(lead);
    const system = 'You are a B2B lead scoring analyst. Return valid JSON only.';
    const prompt = `Refine this lead score. Rule score: ${rules.score}. Rule reasons: ${JSON.stringify(rules.reasons)}.\nLead: ${JSON.stringify(lead)}\nReturn JSON: {"score":75,"label":"Warm","breakdown":[{"label":"reason","points":10,"type":"positive"}],"summary":"one sentence"}`;
    const { text, provider } = await generateText(prompt, system, userId);
    const parsed = extractJson(text);
    const score = Math.max(0, Math.min(100, Number(parsed?.score ?? rules.score)));
    const breakdown = Array.isArray(parsed?.breakdown) ? parsed.breakdown : rules.reasons;
    return { provider, score: Math.round(score), label: labelForScore(score), breakdown, summary: cleanText(parsed?.summary || `Lead scored ${labelForScore(score)}.`, 300), rules };
  });
}

export async function analyzeCompany(userId, input) {
  return cached(userId, 'analyze-company', input, async () => {
    const textBlock = cleanText([input.name, input.company, input.website, input.text, input.email].filter(Boolean).join('\n'), 12000);
    const fallbackIndustry = inferIndustryFromText(textBlock);
    const system = 'You classify companies for a CRM. Return valid JSON only.';
    const prompt = `Analyze this company and infer industry, business type, and outreach angle.\n${textBlock}\nReturn JSON: {"industry":"...","businessType":"...","summary":"...","keywords":["..."],"outreachAngle":"...","confidence":0.7}`;
    const { text, provider } = await generateText(prompt, system, userId);
    const parsed = extractJson(text);
    return {
      provider,
      industry: cleanText(parsed?.industry, 80) || fallbackIndustry,
      businessType: cleanText(parsed?.businessType, 120) || fallbackIndustry,
      summary: cleanText(parsed?.summary, 600) || `Likely ${fallbackIndustry.toLowerCase()} company.`,
      keywords: Array.isArray(parsed?.keywords) ? parsed.keywords.slice(0, 12).map(k => cleanText(k, 40)) : [],
      outreachAngle: cleanText(parsed?.outreachAngle, 400) || 'Lead with a customer acquisition value proposition.',
      confidence: Number(parsed?.confidence || 0.55)
    };
  });
}

export async function chat(userId, messages = []) {
  const recent = messages.slice(-12).map(m => `${m.role}: ${m.content}`).join('\n');
  const system = 'You are FlowAI, an AI-powered CRM assistant. Help with lead generation, campaigns, outreach, and proposals. Keep advice practical and specific.';
  const { text, provider } = await generateText(recent, system, userId);
  return { provider, message: text };
}

export async function providerHealth(userId = null) {
  const cfg = aiConfig(userId);
  const health = [];

  if (configured(cfg.groqApiKey)) {
    health.push({ provider: 'Groq', status: 'configured', model: cfg.groqModel, source: cfg.groqApiKey === env.groqApiKey ? 'env' : 'settings' });
  } else {
    health.push({ provider: 'Groq', status: 'not_configured', model: cfg.groqModel, source: 'not set — get free key at console.groq.com' });
  }

  try {
    await axios.get(cfg.ollamaUrl.replace('/api/generate', '/api/tags'), { timeout: 2000 });
    health.push({ provider: 'Ollama', status: 'online', model: cfg.ollamaModel, source: 'local' });
  } catch {
    health.push({ provider: 'Ollama', status: 'offline', model: cfg.ollamaModel, source: 'local — runs offline, install at ollama.ai' });
  }

  health.push({ provider: 'Rule engine', status: 'online', model: 'built-in', source: 'always available — no API needed' });
  return health;
}
