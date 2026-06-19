import crypto from 'crypto';
import { db } from '../db/database.js';
import { env } from '../config/env.js';
import { jsonParse, jsonString } from '../utils/sanitize.js';
import { nowIso } from '../utils/time.js';

const SECRET_KEYS = new Set([
  'password', 'smtpPass', 'apiKey', 'accessToken', 'refreshToken', 'clientSecret',
  'googleClientSecret', 'gmailAccessToken', 'gmailRefreshToken', 'googlePlacesApiKey',
  'serperApiKey', 'braveSearchApiKey', 'bingSearchApiKey', 'groqApiKey', 'hfApiKey',
  'whatsappAccessToken', 'verifyToken'
]);

const ALLOWED_PROVIDERS = new Set(['workspace', 'email', 'ai', 'search', 'whatsapp']);

function keyFor(provider) {
  return `connection:${provider}`;
}

function cryptoKey() {
  return crypto.createHash('sha256').update(String(env.jwtSecret || 'leadflow-dev-key')).digest();
}

export function encryptSecret(value) {
  if (value === null || value === undefined || value === '') return value;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', cryptoKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `enc:v1:${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

export function decryptSecret(value) {
  if (!value || typeof value !== 'string' || !value.startsWith('enc:v1:')) return value;
  const [, , ivB64, tagB64, dataB64] = value.split(':');
  const decipher = crypto.createDecipheriv('aes-256-gcm', cryptoKey(), Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]).toString('utf8');
}

function walkConfig(config, mode = 'encrypt') {
  if (!config || typeof config !== 'object' || Array.isArray(config)) return config;
  const output = {};
  for (const [key, value] of Object.entries(config)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      output[key] = walkConfig(value, mode);
    } else if (SECRET_KEYS.has(key)) {
      if (mode === 'encrypt') output[key] = encryptSecret(value);
      else if (mode === 'decrypt') output[key] = decryptSecret(value);
      else output[key] = value ? '••••••••' : '';
    } else {
      output[key] = value;
    }
  }
  return output;
}

function removeBlankSecrets(newConfig, oldConfig = {}) {
  const output = { ...newConfig };
  for (const [key, value] of Object.entries(newConfig || {})) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      output[key] = removeBlankSecrets(value, oldConfig?.[key] || {});
    } else if (SECRET_KEYS.has(key) && (value === '' || value === '••••••••' || value === undefined)) {
      if (oldConfig && oldConfig[key] !== undefined) output[key] = oldConfig[key];
      else delete output[key];
    }
  }
  return output;
}

export function getConnection(userId, provider, { masked = false } = {}) {
  if (!ALLOWED_PROVIDERS.has(provider)) return null;
  const row = db.prepare('SELECT value, updated_at FROM settings WHERE user_id = ? AND key = ?').get(userId, keyFor(provider));
  const config = row ? jsonParse(row.value, {}) : {};
  const decrypted = walkConfig(config, 'decrypt') || {};
  return masked ? { ...walkConfig(decrypted, 'mask'), updated_at: row?.updated_at || null } : decrypted;
}

export function getAllConnections(userId, { masked = true } = {}) {
  return Object.fromEntries([...ALLOWED_PROVIDERS].map((provider) => [provider, getConnection(userId, provider, { masked }) || {}]));
}

export function upsertConnection(userId, provider, config = {}) {
  if (!ALLOWED_PROVIDERS.has(provider)) throw new Error(`Unsupported connection provider: ${provider}`);
  const existing = getConnection(userId, provider, { masked: false }) || {};
  const merged = removeBlankSecrets({ ...existing, ...config, updatedAt: nowIso() }, existing);
  const encrypted = walkConfig(merged, 'encrypt');
  db.prepare(`INSERT INTO settings (user_id, key, value, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`)
    .run(userId, keyFor(provider), jsonString(encrypted), nowIso(), nowIso());
  return getConnection(userId, provider, { masked: true });
}

export function deleteConnection(userId, provider) {
  return db.prepare('DELETE FROM settings WHERE user_id = ? AND key = ?').run(userId, keyFor(provider)).changes > 0;
}

export function configured(value) {
  return Boolean(value && String(value).trim() && value !== '••••••••');
}

export function connectionStatus(config, requiredKeys = []) {
  const missing = requiredKeys.filter((key) => !configured(config?.[key]));
  return { connected: missing.length === 0, missing };
}
