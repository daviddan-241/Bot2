import axios from 'axios';
import { env } from '../config/env.js';
import { cleanText } from '../utils/sanitize.js';
import { getConnection, configured } from './connectionService.js';

const USER_AGENT = 'FlowAI/1.0 (business-discovery; contact: app-user)';

function searchConfig(userId) {
  const cfg = userId ? (getConnection(userId, 'search') || {}) : {};
  return {
    serperApiKey:       cfg.serperApiKey       || env.serperApiKey,
    braveSearchApiKey:  cfg.braveSearchApiKey  || env.braveSearchApiKey,
    enableOpenStreetMap: cfg.enableOpenStreetMap !== false,
  };
}

function normalizeWebResult({ title, url, snippet, provider, query }) {
  if (!url || !/^https?:\/\//i.test(url)) return null;
  const blocked = ['google.com/maps', 'facebook.com', 'instagram.com', 'linkedin.com', 'youtube.com', 'twitter.com', 'x.com', 'pinterest.com'];
  if (blocked.some(h => url.toLowerCase().includes(h))) return null;
  return {
    title: cleanText(title, 180),
    name: cleanText(title, 180),
    url, website: url,
    snippet: cleanText(snippet, 500),
    provider, query
  };
}

function normalizePlaceResult({ name, website, phone, email, address, industry, provider, snippet, raw, query }) {
  return {
    title: cleanText(name, 180) || 'Unknown business',
    name: cleanText(name, 180) || 'Unknown business',
    url: website || null,
    website: website || null,
    phone: cleanText(phone, 80) || null,
    email: cleanText(email, 254) ? cleanText(email, 254).toLowerCase() : null,
    address: cleanText(address, 300) || null,
    industryHint: cleanText(industry, 120) || null,
    snippet: cleanText(snippet || address || industry || '', 500),
    provider, query, raw
  };
}

async function serper(query, limit, cfg) {
  if (!configured(cfg.serperApiKey)) throw new Error('Serper API key not set');
  const res = await axios.post('https://google.serper.dev/search', { q: query, num: limit }, {
    headers: { 'X-API-KEY': cfg.serperApiKey, 'Content-Type': 'application/json' },
    timeout: 15000
  });
  return (res.data?.organic || []).map(r => normalizeWebResult({ title: r.title, url: r.link, snippet: r.snippet, provider: 'serper', query })).filter(Boolean);
}

async function brave(query, limit, cfg) {
  if (!configured(cfg.braveSearchApiKey)) throw new Error('Brave Search API key not set');
  const res = await axios.get('https://api.search.brave.com/res/v1/web/search', {
    params: { q: query, count: limit, safesearch: 'moderate' },
    headers: { 'X-Subscription-Token': cfg.braveSearchApiKey, Accept: 'application/json' },
    timeout: 15000
  });
  return (res.data?.web?.results || []).map(r => normalizeWebResult({ title: r.title, url: r.url, snippet: r.description, provider: 'brave', query })).filter(Boolean);
}

function overpassFilters(niche = '', industry = '') {
  const term = `${niche} ${industry}`.toLowerCase();
  if (/dent|dental|orthodont/.test(term)) return [{ key: 'amenity', values: ['dentist'] }];
  if (/clinic|doctor|medical|health|hospital/.test(term)) return [{ key: 'amenity', values: ['clinic', 'doctors', 'hospital'] }];
  if (/pharmacy|chemist/.test(term)) return [{ key: 'amenity', values: ['pharmacy'] }];
  if (/restaurant|food|cafe|bar/.test(term)) return [{ key: 'amenity', values: ['restaurant', 'cafe', 'bar', 'fast_food'] }];
  if (/hotel|guest house|hospitality/.test(term)) return [{ key: 'tourism', values: ['hotel', 'guest_house', 'hostel'] }];
  if (/school|academy|education|college/.test(term)) return [{ key: 'amenity', values: ['school', 'college', 'university'] }];
  if (/real estate|realtor|property/.test(term)) return [{ key: 'office', values: ['estate_agent'] }];
  if (/law|legal|lawyer|attorney|solicitor/.test(term)) return [{ key: 'office', values: ['lawyer'] }];
  if (/bank|finance/.test(term)) return [{ key: 'amenity', values: ['bank'] }, { key: 'office', values: ['financial'] }];
  if (/beauty|salon|spa|hair/.test(term)) return [{ key: 'shop', values: ['beauty', 'hairdresser'] }];
  if (/gym|fitness/.test(term)) return [{ key: 'leisure', values: ['fitness_centre'] }];
  if (/car|auto|mechanic/.test(term)) return [{ key: 'shop', values: ['car_repair', 'car'] }];
  return [
    { key: 'office', values: ['company', 'consulting', 'estate_agent', 'lawyer'] },
    { key: 'shop', values: ['yes', 'beauty', 'clothes', 'computer', 'electronics'] },
    { key: 'amenity', values: ['restaurant', 'clinic', 'school', 'bank'] }
  ];
}

async function bboxForLocation(location) {
  if (!location || location === 'worldwide') throw new Error('Location required for OpenStreetMap search');
  const res = await axios.get('https://nominatim.openstreetmap.org/search', {
    params: { q: location, format: 'json', limit: 1 },
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    timeout: 12000
  });
  const first = res.data?.[0];
  if (!first?.boundingbox) throw new Error(`OpenStreetMap could not find location: ${location}`);
  const [south, north, west, east] = first.boundingbox.map(Number);
  return { south, north, west, east };
}

async function openStreetMap({ niche, location, industry, limit, query }) {
  const bbox = await bboxForLocation(location);
  const bboxStr = `${bbox.south},${bbox.west},${bbox.north},${bbox.east}`;
  const filters = overpassFilters(niche, industry);
  const selectors = filters.flatMap(({ key, values }) => {
    const re = `^(${values.map(v => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})$`;
    return [
      `node["${key}"~"${re}"](${bboxStr});`,
      `way["${key}"~"${re}"](${bboxStr});`,
    ];
  }).join('\n');
  const ql = `[out:json][timeout:30];\n(\n${selectors}\n);\nout center ${Math.min(50, Number(limit || 10))};`;
  const res = await axios.post('https://overpass-api.de/api/interpreter', `data=${encodeURIComponent(ql)}`, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': USER_AGENT },
    timeout: 35000
  });
  return (res.data?.elements || [])
    .map(el => {
      const t = el.tags || {};
      const address = [t['addr:housenumber'], t['addr:street'], t['addr:city'] || location].filter(Boolean).join(' ');
      return normalizePlaceResult({
        name: t.name || t.operator,
        website: t.website || t['contact:website'] || t.url,
        phone: t.phone || t['contact:phone'],
        email: t.email || t['contact:email'],
        address,
        industry: t.amenity || t.office || t.shop || t.tourism || t.leisure,
        snippet: `${t.amenity || t.office || t.shop || ''} ${address}`.trim(),
        provider: 'openstreetmap',
        raw: { id: el.id, type: el.type, tags: t },
        query
      });
    })
    .filter(r => r.name && (r.website || r.phone || r.email))
    .slice(0, limit);
}

export async function searchBusinesses({ userId = null, niche, location, industry, limit = 10 }) {
  const cfg = searchConfig(userId);
  const q1 = `${niche || industry || 'business'} ${location || ''} website contact`.trim();
  const q2 = `${niche || industry || 'business'} ${location || ''} email phone`.trim();
  const errors = [];
  const all = [];

  for (const query of [q1, q2]) {
    for (const providerFn of [serper, brave]) {
      try {
        const res = await providerFn(query, limit, cfg);
        if (res.length) all.push(...res);
      } catch (err) {
        errors.push(err.message);
      }
    }
  }

  if (cfg.enableOpenStreetMap && location && location !== 'worldwide') {
    try {
      const osm = await openStreetMap({ niche, location, industry, limit, query: `${niche || industry} ${location}`.trim() });
      all.push(...osm);
    } catch (err) {
      errors.push(`OpenStreetMap: ${err.message}`);
    }
  }

  const seen = new Set();
  const unique = [];
  for (const r of all) {
    let key = '';
    if (r.website || r.url) {
      try { key = `host:${new URL(r.website || r.url).hostname.replace(/^www\./, '')}`; } catch {}
    }
    if (!key && r.email) key = `email:${r.email}`;
    if (!key && r.phone) key = `phone:${String(r.phone).replace(/\D/g, '')}`;
    if (!key) key = `name:${(r.name || '').toLowerCase()}:${r.address || ''}`;
    if (!seen.has(key)) { seen.add(key); unique.push(r); }
  }

  if (!unique.length) {
    const hasAny = configured(cfg.serperApiKey) || configured(cfg.braveSearchApiKey) || cfg.enableOpenStreetMap;
    if (!hasAny) {
      throw new Error('No search APIs configured. Add a free Serper key (serper.dev) or Brave Search key in Settings, or rely on free OpenStreetMap (always on).');
    }
    if (errors.length) {
      throw new Error(`No businesses found. ${errors.slice(-3).join(' | ')}`);
    }
  }

  return unique.slice(0, limit);
}
