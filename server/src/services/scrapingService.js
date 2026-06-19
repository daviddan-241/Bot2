import { db } from '../db/database.js';
import { nowIso, sleep } from '../utils/time.js';
import { jsonParse, jsonString } from '../utils/sanitize.js';
import { searchBusinesses } from './searchService.js';
import { expandTargetLocations } from './globalRegionsService.js';
import { scrapeWebsite } from './websiteScraper.js';
import { createLead, listLeads } from './leadService.js';

const runningJobs = new Set();

export function createScrapeJob(userId, { niche, location, locations = [], region = '', regions = [], industry, limit = 25 }) {
  let targetLocations = expandTargetLocations({ region, regions, location, locations });
  if (!targetLocations.length) targetLocations = expandTargetLocations({ region: 'north_america_europe' });
  const safeLimit = Math.max(1, Math.min(100, Number(limit || 25)));
  const regionList = [...new Set([region, ...(Array.isArray(regions) ? regions : String(regions || '').split(','))].filter(Boolean))];
  const queryScope = targetLocations.length > 1 ? `${targetLocations.length} real locations` : (targetLocations[0] || 'global');
  const query = `${niche || industry || 'business'} in ${queryScope}`.trim();
  const result = db.prepare(`INSERT INTO scraping_jobs (user_id, query, niche, location, industry, target_regions, target_locations, max_results, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'queued', ?)`).run(userId, query, niche || null, targetLocations[0] || location || null, industry || null, jsonString(regionList), jsonString(targetLocations), safeLimit, nowIso());
  const jobId = result.lastInsertRowid;
  setImmediate(() => runScrapeJob(jobId).catch(() => {}));
  return getScrapeJob(userId, jobId);
}

export function getScrapeJob(userId, jobId) {
  const job = db.prepare('SELECT * FROM scraping_jobs WHERE user_id = ? AND id = ?').get(userId, jobId);
  if (!job) return null;
  const leads = listLeads(userId, { scrapeJobId: jobId, limit: 100 }).rows;
  return { ...job, leads };
}

export async function runScrapeJob(jobId) {
  if (runningJobs.has(jobId)) return;
  runningJobs.add(jobId);
  const job = db.prepare('SELECT * FROM scraping_jobs WHERE id = ?').get(jobId);
  if (!job) { runningJobs.delete(jobId); return; }
  try {
    db.prepare(`UPDATE scraping_jobs SET status = 'running', started_at = ?, error = NULL WHERE id = ?`).run(nowIso(), jobId);
    const targetLocations = jsonParse(job.target_locations, null) || (job.location ? [job.location] : expandTargetLocations({ region: 'north_america_europe' }));
    const maxResults = Math.max(1, Math.min(100, Number(job.max_results || 25)));
    const seenResultKeys = new Set();
    const results = [];
    for (const targetLocation of targetLocations) {
      if (results.length >= maxResults) break;
      const perLocationLimit = Math.min(10, maxResults - results.length);
      try {
        const found = await searchBusinesses({ userId: job.user_id, niche: job.niche, location: targetLocation, industry: job.industry, limit: perLocationLimit });
        for (const item of found) {
          const key = (item.website || item.url || item.email || item.phone || `${item.name}:${item.address || targetLocation}`).toLowerCase();
          if (!seenResultKeys.has(key)) {
            seenResultKeys.add(key);
            results.push({ ...item, targetLocation });
          }
          if (results.length >= maxResults) break;
        }
      } catch (error) {
        const previous = db.prepare('SELECT error FROM scraping_jobs WHERE id = ?').get(jobId)?.error || '';
        db.prepare(`UPDATE scraping_jobs SET error = ? WHERE id = ?`).run(`${previous}\n${targetLocation}: ${error.message}`.trim().slice(0, 5000), jobId);
      }
      await sleep(1200);
    }
    let count = 0;
    for (const result of results) {
      try {
        await sleep(1400);
        const website = result.website || result.url;
        let scraped = null;
        if (website) {
          try { scraped = await scrapeWebsite(website); } catch (error) { scraped = { skipped: true, reason: error.message, emails: [], phones: [], socialLinks: [], rawText: '' }; }
        }
        const hasDirectData = result.email || result.phone || website;
        if (scraped?.skipped && !hasDirectData) continue;
        const lead = await createLead(job.user_id, {
          name: scraped?.companyName || result.name || result.title,
          company: scraped?.companyName || result.name || result.title,
          email: scraped?.emails?.[0] || result.email || null,
          phone: scraped?.phones?.[0] || result.phone || null,
          website: scraped?.website || website || null,
          industry: job.industry || result.industryHint,
          location: result.address || result.targetLocation || job.location,
          source: result.provider?.includes('openstreetmap') || result.provider?.includes('google_places') ? 'business_api' : 'scraped',
          socialLinks: scraped?.socialLinks || [],
          rawText: `${result.snippet || ''}\n${scraped?.rawText || ''}`,
          rawData: { searchResult: result, scraped }
        }, { score: true, analyze: true, scrapeJobId: jobId });
        if (lead) count += 1;
        db.prepare(`UPDATE scraping_jobs SET result_count = ? WHERE id = ?`).run(count, jobId);
      } catch (error) {
        // Per-site failures are retained in job error string but do not stop the whole legal discovery pipeline.
        const previous = db.prepare('SELECT error FROM scraping_jobs WHERE id = ?').get(jobId)?.error || '';
        db.prepare(`UPDATE scraping_jobs SET error = ? WHERE id = ?`).run(`${previous}\n${result.website || result.url || result.name}: ${error.message}`.trim().slice(0, 3000), jobId);
      }
    }
    db.prepare(`UPDATE scraping_jobs SET status = 'completed', result_count = ?, completed_at = ? WHERE id = ?`).run(count, nowIso(), jobId);
  } catch (error) {
    db.prepare(`UPDATE scraping_jobs SET status = 'failed', error = ?, completed_at = ? WHERE id = ?`).run(error.message, nowIso(), jobId);
  } finally {
    runningJobs.delete(jobId);
  }
}

export function listScrapeJobs(userId) {
  return db.prepare('SELECT * FROM scraping_jobs WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').all(userId);
}
