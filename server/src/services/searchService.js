import axios from 'axios';
import { env } from '../config/env.js';
import { cleanText } from '../utils/sanitize.js';
import { getConnection, configured } from './connectionService.js';

const USER_AGENT = 'LeadFlowAI/1.0 (legal business discovery; contact: local-user)';

function searchConfig(userId) {
  const cfg = userId ? (getConnection(userId, 'search') || {}) : {};
  return {
    googlePlacesApiKey: cfg.googlePlacesApiKey || '',
    serperApiKey: cfg.serperApiKey || env.serperApiKey,
    braveSearchApiKey: cfg.braveSearchApiKey || env.braveSearchApiKey,
    bingSearchApiKey: cfg.bingSearchApiKey || env.bingSearchApiKey,
    enableOpenStreetMap: cfg.enableOpenStreetMap !== false,
  };
}

function normalizeWebResult({ title, url, snippet, provider, query }) {
  if (!url || !/^https?:\/\//i.test(url)) return null;
  const blockedHosts = ['google.com/maps', 'facebook.com', 'instagram.com', 'linkedin.com', 'youtube.com', 'twitter.com', 'x.com', 'pinterest.com'];
  if (blockedHosts.some((host) => url.toLowerCase().includes(host))) return null;
  return { title: cleanText(title, 180), name: cleanText(title, 180), url, website: url, snippet: cleanText(snippet, 500), provider, query };
}

function normalizePlaceResult({ name, website, phone, email, address, industry, provider, snippet, raw, query }) {
  return {
    title: cleanText(name, 180) || 'Unknown business',
    name: cleanText(name, 180) || 'Unknown business',
    url: website || null,
    website: website || null,
    phone: cleanText(phone, 80) || null,
    email: cleanText(email, 254).toLowerCase() || null,
    address: cleanText(address, 300) || null,
    industryHint: cleanText(industry, 120) || null,
    snippet: cleanText(snippet || address || industry || '', 500),
    provider,
    query,
    raw
  };
}

async function googlePlaces(query, limit, cfg) {
  if (!configured(cfg.googlePlacesApiKey)) throw new Error('Google Places API key not connected');
  const response = await axios.post('https://places.googleapis.com/v1/places:searchText', {
    textQuery: query,
    maxResultCount: Math.max(1, Math.min(20, Number(limit || 10)))
  }, {
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': cfg.googlePlacesApiKey,
      'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.websiteUri,places.nationalPhoneNumber,places.internationalPhoneNumber,places.primaryTypeDisplayName,places.types,places.businessStatus'
    },
    timeout: 15000
  });
  return (response.data?.places || []).map((place) => normalizePlaceResult({
    name: place.displayName?.text,
    website: place.websiteUri,
    phone: place.internationalPhoneNumber || place.nationalPhoneNumber,
    address: place.formattedAddress,
    industry: place.primaryTypeDisplayName?.text || place.types?.[0],
    snippet: `${place.primaryTypeDisplayName?.text || ''} ${place.formattedAddress || ''}`,
    provider: 'google_places',
    raw: place,
    query
  }));
}

async function serper(query, limit, cfg) {
  if (!configured(cfg.serperApiKey)) throw new Error('Serper API key not connected');
  const response = await axios.post('https://google.serper.dev/search', { q: query, num: limit }, {
    headers: { 'X-API-KEY': cfg.serperApiKey, 'Content-Type': 'application/json' }, timeout: 15000
  });
  return (response.data?.organic || []).map((r) => normalizeWebResult({ title: r.title, url: r.link, snippet: r.snippet, provider: 'serper', query })).filter(Boolean);
}

async function brave(query, limit, cfg) {
  if (!configured(cfg.braveSearchApiKey)) throw new Error('Brave Search API key not connected');
  const response = await axios.get('https://api.search.brave.com/res/v1/web/search', {
    params: { q: query, count: limit, safesearch: 'moderate' },
    headers: { 'X-Subscription-Token': cfg.braveSearchApiKey, Accept: 'application/json' },
    timeout: 15000
  });
  return (response.data?.web?.results || []).map((r) => normalizeWebResult({ title: r.title, url: r.url, snippet: r.description, provider: 'brave', query })).filter(Boolean);
}

async function bing(query, limit, cfg) {
  if (!configured(cfg.bingSearchApiKey)) throw new Error('Bing Search API key not connected');
  const response = await axios.get('https://api.bing.microsoft.com/v7.0/search', {
    params: { q: query, count: limit, responseFilter: 'Webpages' },
    headers: { 'Ocp-Apim-Subscription-Key': cfg.bingSearchApiKey },
    timeout: 15000
  });
  return (response.data?.webPages?.value || []).map((r) => normalizeWebResult({ title: r.name, url: r.url, snippet: r.snippet, provider: 'bing', query })).filter(Boolean);
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
  if (!location) throw new Error('Location is required for free OpenStreetMap discovery');
  const response = await axios.get('https://nominatim.openstreetmap.org/search', {
    params: { q: location, format: 'json', limit: 1 },
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    timeout: 12000
  });
  const first = response.data?.[0];
  if (!first?.boundingbox) throw new Error(`OpenStreetMap could not locate ${location}`);
  const [south, north, west, east] = first.boundingbox.map(Number);
  return { south, north, west, east, displayName: first.display_name };
}

async function openStreetMapOverpass({ niche, location, industry, limit, query }) {
  const bbox = await bboxForLocation(location);
  const bboxText = `${bbox.south},${bbox.west},${bbox.north},${bbox.east}`;
  const filters = overpassFilters(niche, industry);
  const selectors = filters.flatMap(({ key, values }) => {
    const valueRegex = `^(${values.map((v) => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})$`;
    return [
      `node["${key}"~"${valueRegex}"](${bboxText});`,
      `way["${key}"~"${valueRegex}"](${bboxText});`,
      `relation["${key}"~"${valueRegex}"](${bboxText});`
    ];
  }).join('\n');
  const ql = `[out:json][timeout:25];\n(\n${selectors}\n);\nout center ${Math.max(1, Math.min(50, Number(limit || 10)))};`;
  const response = await axios.post('https://overpass-api.de/api/interpreter', `data=${encodeURIComponent(ql)}`, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': USER_AGENT },
    timeout: 30000
  });
  return (response.data?.elements || [])
    .map((el) => {
      const t = el.tags || {};
      const address = [t['addr:housenumber'], t['addr:street'], t['addr:city'] || location].filter(Boolean).join(' ');
      return normalizePlaceResult({
        name: t.name || t.operator,
        website: t.website || t['contact:website'] || t.url,
        phone: t.phone || t['contact:phone'],
        email: t.email || t['contact:email'],
        address,
        industry: t.amenity || t.office || t.shop || t.tourism || t.leisure,
        snippet: `${t.amenity || t.office || t.shop || ''} ${address}`,
        provider: 'openstreetmap_overpass',
        raw: { id: el.id, type: el.type, tags: t, lat: el.lat || el.center?.lat, lon: el.lon || el.center?.lon },
        query
      });
    })
    .filter((r) => r.name && (r.website || r.phone || r.email))
    .slice(0, limit);
}

export async function searchBusinesses({ userId = null, niche, location, industry, limit = 10 }) {
  const cfg = searchConfig(userId);
  const q1 = `${niche || industry || 'business'} ${location || ''} website`.trim();
  const q2 = `${niche || industry || 'business'} contact email ${location || ''}`.trim();
  const queries = [...new Set([q1, q2])];
  const errors = [];
  const all = [];

  for (const query of queries) {
    for (const provider of [googlePlaces, serper, brave, bing]) {
      try {
        const results = await provider(query, limit, cfg);
        if (results.length) all.push(...results);
      } catch (error) {
        errors.push(error.message);
      }
    }
  }

  if (cfg.enableOpenStreetMap) {
    try {
      const osm = await openStreetMapOverpass({ niche, location, industry, limit, query: `${niche || industry} ${location}`.trim() });
      all.push(...osm);
    } catch (error) {
      errors.push(error.message);
    }
  }

  const seen = new Set();
  const unique = [];
  for (const result of all) {
    let key = '';
    if (result.website || result.url) {
      try { key = `host:${new URL(result.website || result.url).hostname.replace(/^www\./, '')}`; } catch {}
    }
    if (!key && result.email) key = `email:${result.email}`;
    if (!key && result.phone) key = `phone:${String(result.phone).replace(/\D/g, '')}`;
    if (!key) key = `name:${result.name}:${result.address || ''}`.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(result);
    }
  }

  if (!unique.length) {
    const configuredApis = configured(cfg.googlePlacesApiKey) || configured(cfg.serperApiKey) || configured(cfg.braveSearchApiKey) || configured(cfg.bingSearchApiKey) || cfg.enableOpenStreetMap;
    if (!configuredApis) throw new Error('No business discovery provider is connected. Add Google Places, Serper, Brave, Bing, or enable OpenStreetMap in Connections.');
    if (errors.length) throw new Error(`Business discovery returned no results. Last provider messages: ${errors.slice(-5).join('; ')}`);
  }
  return unique.slice(0, limit);
}
