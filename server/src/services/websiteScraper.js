import axios from 'axios';
import * as cheerio from 'cheerio';
import robotsParser from 'robots-parser';
import { cleanText } from '../utils/sanitize.js';

const USER_AGENT = 'LeadFlowAI/1.0 (+https://leadflow.local; respects robots.txt)';
const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_REGEX = /(\+?\d[\d\s().-]{7,}\d)/g;

function absoluteUrl(base, href) {
  try { return new URL(href, base).toString(); } catch { return null; }
}

async function robotsAllowed(url) {
  try {
    const parsed = new URL(url);
    const robotsUrl = `${parsed.protocol}//${parsed.host}/robots.txt`;
    const response = await axios.get(robotsUrl, { timeout: 5000, headers: { 'User-Agent': USER_AGENT } });
    const robots = robotsParser(robotsUrl, response.data || '');
    return robots.isAllowed(url, USER_AGENT) !== false;
  } catch {
    return true;
  }
}

async function fetchHtml(url) {
  const allowed = await robotsAllowed(url);
  if (!allowed) return { url, skipped: true, reason: 'Blocked by robots.txt', html: '' };
  const response = await axios.get(url, {
    timeout: 12000,
    maxRedirects: 4,
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    },
    validateStatus: (status) => status >= 200 && status < 400
  });
  const type = response.headers['content-type'] || '';
  if (!type.includes('text/html') && !type.includes('application/xhtml')) {
    return { url: response.request?.res?.responseUrl || url, html: '', skipped: true, reason: `Unsupported content type ${type}` };
  }
  return { url: response.request?.res?.responseUrl || url, html: response.data || '' };
}

function extractFromHtml(baseUrl, html) {
  const $ = cheerio.load(html || '');
  $('script, style, noscript, svg').remove();
  const text = cleanText($('body').text(), 12000);
  const title = cleanText($('title').first().text(), 180);
  const h1 = cleanText($('h1').first().text(), 180);
  const metaName = cleanText($('meta[property="og:site_name"]').attr('content') || $('meta[name="application-name"]').attr('content'), 180);
  const description = cleanText($('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content'), 500);

  const mailtos = $('a[href^="mailto:"]').map((_, el) => String($(el).attr('href')).replace(/^mailto:/i, '').split('?')[0]).get();
  const emails = [...new Set([...(html.match(EMAIL_REGEX) || []), ...mailtos].map((email) => email.toLowerCase().trim()).filter((email) => !email.endsWith('.png') && !email.endsWith('.jpg')))].slice(0, 8);
  const phones = [...new Set((text.match(PHONE_REGEX) || []).map((p) => p.replace(/\s+/g, ' ').trim()).filter((p) => p.replace(/\D/g, '').length >= 8))].slice(0, 8);

  const socialLinks = $('a[href]').map((_, el) => $(el).attr('href')).get()
    .map((href) => absoluteUrl(baseUrl, href))
    .filter(Boolean)
    .filter((href) => /(linkedin|facebook|instagram|twitter|x\.com|youtube|tiktok)\.com/i.test(href));

  const contactLinks = $('a[href]').map((_, el) => ({ href: $(el).attr('href'), text: cleanText($(el).text(), 80) })).get()
    .filter((link) => /(contact|about|get in touch|reach us|location|visit)/i.test(`${link.href} ${link.text}`))
    .map((link) => absoluteUrl(baseUrl, link.href))
    .filter(Boolean);

  return { text, title, h1, metaName, description, emails, phones, socialLinks: [...new Set(socialLinks)].slice(0, 8), contactLinks: [...new Set(contactLinks)].slice(0, 3) };
}

function guessCompanyName(parts, url) {
  const candidates = [parts.metaName, parts.h1, parts.title]
    .filter(Boolean)
    .map((value) => value.replace(/\s+[|—-].*$/, '').trim())
    .filter((value) => value.length >= 2 && value.length <= 80);
  if (candidates.length) return candidates[0];
  try {
    return new URL(url).hostname.replace(/^www\./, '').split('.')[0].replace(/[-_]/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
  } catch { return 'Unknown Company'; }
}

export async function scrapeWebsite(inputUrl) {
  const homepageUrl = /^https?:\/\//i.test(inputUrl) ? inputUrl : `https://${inputUrl}`;
  const home = await fetchHtml(homepageUrl);
  if (home.skipped || !home.html) {
    return { website: homepageUrl, skipped: true, reason: home.reason || 'No HTML found', emails: [], phones: [], socialLinks: [], rawText: '' };
  }
  const homeParts = extractFromHtml(home.url, home.html);
  const contactUrl = homeParts.contactLinks.find((href) => {
    try { return new URL(href).hostname === new URL(home.url).hostname && href !== home.url; } catch { return false; }
  });

  let contactParts = { emails: [], phones: [], socialLinks: [], text: '', description: '', title: '', h1: '', metaName: '', contactLinks: [] };
  if (contactUrl) {
    try {
      const contact = await fetchHtml(contactUrl);
      if (!contact.skipped && contact.html) contactParts = extractFromHtml(contact.url, contact.html);
    } catch {
      // Keep homepage result if contact page fails.
    }
  }

  const emails = [...new Set([...homeParts.emails, ...contactParts.emails])].slice(0, 8);
  const phones = [...new Set([...homeParts.phones, ...contactParts.phones])].slice(0, 8);
  const socialLinks = [...new Set([...homeParts.socialLinks, ...contactParts.socialLinks])].slice(0, 8);
  const rawText = cleanText(`${homeParts.title}\n${homeParts.description}\n${homeParts.text}\n${contactParts.text}`, 16000);
  return {
    website: home.url,
    contactUrl,
    companyName: guessCompanyName(homeParts, home.url),
    title: homeParts.title,
    description: homeParts.description,
    emails,
    phones,
    socialLinks,
    rawText,
    skipped: false
  };
}
