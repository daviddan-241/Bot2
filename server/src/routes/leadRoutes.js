import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, ApiError } from '../utils/http.js';
import { listLeads, getLead, createLead, updateLead, deleteLead, rescoreLead } from '../services/leadService.js';
import { createScrapeJob, getScrapeJob, listScrapeJobs } from '../services/scrapingService.js';
import { scoreLead as aiScoreLead } from '../services/aiService.js';
import { listRegionPresets } from '../services/globalRegionsService.js';
import { scrapeLimiter } from '../middleware/security.js';

const router = Router();

const leadSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  title: z.string().max(160).optional().nullable(),
  company: z.string().max(200).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  phone: z.string().max(80).optional().nullable(),
  website: z.string().max(2048).optional().nullable(),
  industry: z.string().max(120).optional().nullable(),
  location: z.string().max(180).optional().nullable(),
  source: z.string().max(50).optional(),
  status: z.string().max(40).optional()
});

router.get('/', asyncHandler(async (req, res) => {
  const data = listLeads(req.user.id, req.query);
  res.json(data);
}));

router.post('/', asyncHandler(async (req, res) => {
  const payload = leadSchema.parse(req.body);
  const lead = await createLead(req.user.id, { ...payload, source: payload.source || 'manual' }, { score: true, analyze: true });
  res.status(201).json({ lead });
}));

router.post('/scrape', scrapeLimiter, asyncHandler(async (req, res) => {
  const schema = z.object({
    niche: z.string().min(2).max(120),
    location: z.string().max(180).optional().nullable(),
    locations: z.array(z.string().max(180)).optional(),
    region: z.string().max(80).default('north_america_europe'),
    regions: z.array(z.string().max(80)).optional(),
    industry: z.string().max(120).optional().nullable(),
    limit: z.number().min(1).max(100).optional()
  });
  const input = schema.parse(req.body);
  const job = createScrapeJob(req.user.id, input);
  res.status(202).json({ job });
}));

router.get('/scrape/regions', asyncHandler(async (_req, res) => {
  res.json({ regions: listRegionPresets() });
}));

router.get('/scrape/jobs', asyncHandler(async (req, res) => {
  res.json({ jobs: listScrapeJobs(req.user.id) });
}));

router.get('/scrape/:jobId', asyncHandler(async (req, res) => {
  const job = getScrapeJob(req.user.id, Number(req.params.jobId));
  if (!job) throw new ApiError(404, 'Scrape job not found');
  res.json({ job });
}));

router.post('/score', asyncHandler(async (req, res) => {
  const schema = z.object({ leadIds: z.array(z.number()).optional(), lead: z.record(z.any()).optional() });
  const input = schema.parse(req.body);
  if (input.leadIds?.length) {
    const results = [];
    for (const leadId of input.leadIds) results.push(await rescoreLead(req.user.id, leadId));
    return res.json({ results: results.filter(Boolean) });
  }
  if (input.lead) return res.json(await aiScoreLead(req.user.id, input.lead));
  throw new ApiError(400, 'Provide leadIds or lead');
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const lead = getLead(req.user.id, Number(req.params.id));
  if (!lead) throw new ApiError(404, 'Lead not found');
  res.json({ lead });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const payload = leadSchema.partial().parse(req.body);
  const lead = await updateLead(req.user.id, Number(req.params.id), payload, { rescore: req.query.rescore === 'true' });
  if (!lead) throw new ApiError(404, 'Lead not found');
  res.json({ lead });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const ok = deleteLead(req.user.id, Number(req.params.id));
  if (!ok) throw new ApiError(404, 'Lead not found');
  res.status(204).end();
}));

router.post('/:id/score', asyncHandler(async (req, res) => {
  const lead = await rescoreLead(req.user.id, Number(req.params.id));
  if (!lead) throw new ApiError(404, 'Lead not found');
  res.json({ lead });
}));

export default router;
