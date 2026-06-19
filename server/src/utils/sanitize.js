import validator from 'validator';

export function cleanText(value, max = 500) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

export function cleanNullable(value, max = 500) {
  const cleaned = cleanText(value, max);
  return cleaned || null;
}

export function cleanEmail(value) {
  const email = cleanText(value, 254).toLowerCase();
  return validator.isEmail(email) ? email : null;
}

export function cleanUrl(value) {
  const url = cleanText(value, 2048);
  if (!url) return null;
  const candidate = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  return validator.isURL(candidate, { protocols: ['http', 'https'], require_protocol: true }) ? candidate : null;
}

export function jsonParse(value, fallback = null) {
  if (!value) return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

export function jsonString(value) {
  return JSON.stringify(value ?? null);
}
