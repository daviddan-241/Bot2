import { cleanText } from '../utils/sanitize.js';

const PERSONAL_EMAIL_DOMAINS = new Set([
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com', 'proton.me', 'protonmail.com', 'live.com', 'msn.com', 'ymail.com'
]);

const INDUSTRY_KEYWORDS = {
  Healthcare: ['clinic', 'doctor', 'dentist', 'dental', 'health', 'hospital', 'pharmacy', 'medical', 'wellness'],
  'Real Estate': ['real estate', 'property', 'realtor', 'apartment', 'homes', 'housing', 'estate', 'broker'],
  Legal: ['law', 'legal', 'attorney', 'solicitor', 'barrister', 'chambers'],
  Finance: ['finance', 'accounting', 'tax', 'insurance', 'bank', 'wealth', 'loan'],
  Education: ['school', 'academy', 'college', 'training', 'tutor', 'education'],
  Hospitality: ['hotel', 'restaurant', 'bar', 'lounge', 'cafe', 'catering'],
  Technology: ['software', 'technology', 'digital', 'cloud', 'cyber', 'data', 'automation', 'ai'],
  Ecommerce: ['shop', 'store', 'commerce', 'retail', 'fashion', 'marketplace'],
  'B2B Services': ['consulting', 'agency', 'services', 'marketing', 'logistics', 'cleaning', 'security']
};

function domainFromEmail(email = '') {
  const parts = String(email).toLowerCase().split('@');
  return parts.length === 2 ? parts[1] : '';
}

function hostname(url = '') {
  try { return new URL(url).hostname.replace(/^www\./, '').toLowerCase(); } catch { return ''; }
}

function labelForScore(score) {
  if (score >= 80) return 'Hot';
  if (score >= 50) return 'Warm';
  return 'Cold';
}

export function inferIndustryFromText(input = '') {
  const haystack = cleanText(input, 8000).toLowerCase();
  let best = { industry: 'General Business', matches: 0 };
  for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
    const matches = keywords.reduce((count, keyword) => count + (haystack.includes(keyword) ? 1 : 0), 0);
    if (matches > best.matches) best = { industry, matches };
  }
  return best.industry;
}

export function ruleScoreLead(lead = {}) {
  let score = 20;
  const reasons = [{ label: 'Base reachable business profile', points: 20, type: 'positive' }];
  const emailDomain = domainFromEmail(lead.email);
  const webHost = hostname(lead.website);
  const combined = [lead.name, lead.company, lead.industry, lead.website, lead.email, lead.phone, lead.analysis, lead.rawText]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (lead.website) {
    score += 15;
    reasons.push({ label: 'Company website present', points: 15, type: 'positive' });
  }

  if (lead.email) {
    if (emailDomain && !PERSONAL_EMAIL_DOMAINS.has(emailDomain)) {
      score += 20;
      reasons.push({ label: 'Business email domain', points: 20, type: 'positive' });
      if (webHost && (webHost.includes(emailDomain) || emailDomain.includes(webHost))) {
        score += 8;
        reasons.push({ label: 'Email matches website domain', points: 8, type: 'positive' });
      }
    } else {
      score += 5;
      reasons.push({ label: 'Personal email is usable but weaker', points: 5, type: 'neutral' });
    }
  }

  if (lead.phone || lead.normalized_phone) {
    score += 8;
    reasons.push({ label: 'Phone number available', points: 8, type: 'positive' });
  }

  let keywordMatches = 0;
  for (const keywords of Object.values(INDUSTRY_KEYWORDS)) {
    keywordMatches += keywords.reduce((count, keyword) => count + (combined.includes(keyword) ? 1 : 0), 0);
  }
  if (keywordMatches >= 3) {
    score += 25;
    reasons.push({ label: 'Strong industry keyword signals', points: 25, type: 'positive' });
  } else if (keywordMatches > 0) {
    score += 12;
    reasons.push({ label: 'Some industry keyword signals', points: 12, type: 'positive' });
  }

  const completeness = ['name', 'company', 'email', 'phone', 'website', 'industry'].reduce((count, key) => count + (lead[key] ? 1 : 0), 0);
  if (completeness >= 5) {
    score += 20;
    reasons.push({ label: 'Clean structured data', points: 20, type: 'positive' });
  } else if (completeness <= 2) {
    score -= 10;
    reasons.push({ label: 'Weak or incomplete data', points: -10, type: 'negative' });
  }

  const sizeSignals = ['careers', 'locations', 'team', 'enterprise', 'branches', 'clients', 'portfolio'];
  const sizeMatches = sizeSignals.filter((signal) => combined.includes(signal)).length;
  if (sizeMatches >= 2) {
    score += 10;
    reasons.push({ label: 'Company size/growth signals', points: 10, type: 'positive' });
  }

  if (!lead.email && !lead.phone) {
    score -= 15;
    reasons.push({ label: 'No direct contact channel found', points: -15, type: 'negative' });
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  return { score, label: labelForScore(score), reasons };
}

export { labelForScore, PERSONAL_EMAIL_DOMAINS, INDUSTRY_KEYWORDS };
