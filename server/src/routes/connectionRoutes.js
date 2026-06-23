import { Router } from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../config/env.js';
import { authRequired } from '../middleware/auth.js';
import { asyncHandler, ApiError } from '../utils/http.js';
import { getAllConnections, getConnection, upsertConnection, deleteConnection } from '../services/connectionService.js';
import { sendEmail, emailHealth } from '../services/emailService.js';
import { searchBusinesses } from '../services/searchService.js';
import { validateWhatsAppNumber, sendWhatsApp, whatsappHealth } from '../services/whatsappService.js';
import { providerHealth } from '../services/aiService.js';

const router = Router();
const providers = ['workspace', 'email', 'ai', 'search', 'whatsapp'];

function publicBaseUrl(req) {
  return `${req.protocol}://${req.get('host')}`;
}

function oauthHtml(title, message, ok = true) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head><body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;background:#0B1220;color:white;display:grid;place-items:center;min-height:100vh;margin:0"><main style="max-width:520px;padding:32px;border:1px solid rgba(255,255,255,.12);border-radius:28px;background:rgba(255,255,255,.06)"><div style="font-size:40px">${ok ? '✅' : '⚠️'}</div><h1>${title}</h1><p style="line-height:1.7;color:#cbd5e1">${message}</p><button onclick="window.close()" style="border:0;border-radius:16px;background:#3B82F6;color:white;padding:12px 18px;font-weight:800">Close window</button></main><script>setTimeout(()=>{try{window.opener&&window.opener.postMessage({type:'leadflow:gmail-oauth',ok:${ok}},'*')}catch(e){}},300)</script></body></html>`;
}

router.get('/gmail/oauth/callback', asyncHandler(async (req, res) => {
  const { code, state, error } = req.query;
  if (error) return res.status(400).send(oauthHtml('Google connection failed', String(error), false));
  if (!code || !state) return res.status(400).send(oauthHtml('Google connection failed', 'Missing OAuth code or state.', false));

  let payload;
  try { payload = jwt.verify(String(state), env.jwtSecret); } catch { return res.status(400).send(oauthHtml('Google connection failed', 'OAuth state expired or invalid.', false)); }
  if (payload.type !== 'gmail_oauth') return res.status(400).send(oauthHtml('Google connection failed', 'Invalid OAuth state.', false));

  const userId = Number(payload.sub);
  const cfg = getConnection(userId, 'email') || {};
  const redirectUri = cfg.googleRedirectUri || `${publicBaseUrl(req)}/connections/gmail/oauth/callback`;
  if (!cfg.googleClientId || !cfg.googleClientSecret) return res.status(400).send(oauthHtml('Google connection failed', 'Google OAuth Client ID/Secret are not saved in Connections.', false));

  try {
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', new URLSearchParams({
      code: String(code),
      client_id: cfg.googleClientId,
      client_secret: cfg.googleClientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 15000 });

    const tokens = tokenResponse.data || {};
    let gmailAddress = cfg.gmailAddress;
    try {
      const userInfo = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', { headers: { Authorization: `Bearer ${tokens.access_token}` }, timeout: 10000 });
      gmailAddress = userInfo.data?.email || gmailAddress;
    } catch {}

    upsertConnection(userId, 'email', {
      method: 'gmail_oauth',
      googleClientId: cfg.googleClientId,
      googleClientSecret: cfg.googleClientSecret,
      googleRedirectUri: redirectUri,
      gmailAddress,
      gmailAccessToken: tokens.access_token,
      gmailRefreshToken: tokens.refresh_token || cfg.gmailRefreshToken,
      gmailTokenExpiry: tokens.expires_in ? Date.now() + Number(tokens.expires_in) * 1000 : null,
      smtpFrom: cfg.smtpFrom || (gmailAddress ? `FlowAI <${gmailAddress}>` : undefined),
      connectedAt: new Date().toISOString()
    });
    return res.send(oauthHtml('Gmail connected', `FlowAI can now send real email from ${gmailAddress || 'your Gmail account'} using Google OAuth.`, true));
  } catch (err) {
    const message = err.response?.data?.error_description || err.response?.data?.error || err.message;
    return res.status(400).send(oauthHtml('Google connection failed', message, false));
  }
}));

router.use(authRequired);

router.get('/', asyncHandler(async (req, res) => {
  res.json({
    connections: getAllConnections(req.user.id, { masked: true }),
    health: {
      workspace: { connected: true, ...getConnection(req.user.id, 'workspace', { masked: true }) },
      email: emailHealth(req.user.id),
      whatsapp: whatsappHealth(req.user.id),
      ai: await providerHealth(req.user.id),
    }
  });
}));

router.get('/gmail/oauth/start', asyncHandler(async (req, res) => {
  const cfg = getConnection(req.user.id, 'email') || {};
  const redirectUri = cfg.googleRedirectUri || `${publicBaseUrl(req)}/connections/gmail/oauth/callback`;
  if (!cfg.googleClientId || !cfg.googleClientSecret) throw new ApiError(400, 'Save Google OAuth Client ID and Client Secret first.');
  const state = jwt.sign({ sub: req.user.id, type: 'gmail_oauth', ts: Date.now() }, env.jwtSecret, { expiresIn: '10m' });
  const params = new URLSearchParams({
    client_id: cfg.googleClientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    scope: 'https://mail.google.com/ https://www.googleapis.com/auth/userinfo.email',
    state
  });
  res.json({ authUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`, redirectUri });
}));

router.put('/:provider', asyncHandler(async (req, res) => {
  const provider = req.params.provider;
  if (!providers.includes(provider)) throw new ApiError(404, 'Connection provider not found');
  const schema = z.record(z.any());
  const config = schema.parse(req.body || {});
  res.json({ connection: upsertConnection(req.user.id, provider, config) });
}));

router.delete('/:provider', asyncHandler(async (req, res) => {
  const provider = req.params.provider;
  if (!providers.includes(provider)) throw new ApiError(404, 'Connection provider not found');
  deleteConnection(req.user.id, provider);
  res.status(204).end();
}));

router.post('/:provider/test', asyncHandler(async (req, res) => {
  const provider = req.params.provider;
  if (provider === 'email') {
    const to = req.body?.to || req.user.email;
    const result = await sendEmail({ userId: req.user.id, to, subject: 'FlowAI email connection test', text: 'This is a real test email sent by your FlowAI connection.' });
    return res.json(result);
  }
  if (provider === 'search') {
    const data = await searchBusinesses({
      userId: req.user.id,
      niche: req.body?.niche || 'dentists',
      location: req.body?.location || 'Lagos',
      industry: req.body?.industry || 'Healthcare',
      limit: Math.min(5, Number(req.body?.limit || 3))
    });
    return res.json({ results: data });
  }
  if (provider === 'whatsapp') {
    const phone = req.body?.phone;
    if (!phone) throw new ApiError(400, 'Phone number is required for WhatsApp test.');
    if (req.body?.send === true && req.body?.message) return res.json(await sendWhatsApp({ userId: req.user.id, phone, message: req.body.message }));
    return res.json(await validateWhatsAppNumber(req.user.id, phone, req.body?.country));
  }
  if (provider === 'ai') return res.json({ providers: await providerHealth(req.user.id) });
  if (provider === 'workspace') return res.json({ workspace: getConnection(req.user.id, 'workspace', { masked: true }) || {} });
  throw new ApiError(404, 'Connection provider not found');
}));

export default router;
