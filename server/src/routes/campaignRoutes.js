import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, ApiError } from '../utils/http.js';
import { listCampaigns, createCampaign, getCampaign, addLeadsToCampaign, runCampaign } from '../services/campaignService.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  res.json({ campaigns: listCampaigns(req.user.id) });
}));

router.post('/', asyncHandler(async (req, res) => {
  const schema = z.object({ name: z.string().min(1).max(160), channel: z.enum(['email', 'whatsapp', 'multi']).default('email'), tone: z.string().max(60).default('friendly'), subject: z.string().max(200).optional(), template: z.string().max(4000).optional() });
  const campaign = createCampaign(req.user.id, schema.parse(req.body));
  res.status(201).json({ campaign });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const campaign = getCampaign(req.user.id, Number(req.params.id));
  if (!campaign) throw new ApiError(404, 'Campaign not found');
  res.json({ campaign });
}));

router.post('/:id/leads', asyncHandler(async (req, res) => {
  const schema = z.object({ leadIds: z.array(z.number()).min(1) });
  const result = addLeadsToCampaign(req.user.id, Number(req.params.id), schema.parse(req.body).leadIds);
  if (!result) throw new ApiError(404, 'Campaign not found');
  res.json(result);
}));

router.post('/:id/run', asyncHandler(async (req, res) => {
  const schema = z.object({ delayMs: z.number().min(1000).max(120000).optional(), tone: z.string().max(60).optional(), offer: z.string().max(600).optional() });
  const campaign = runCampaign(req.user.id, Number(req.params.id), schema.parse(req.body));
  if (!campaign) throw new ApiError(404, 'Campaign not found');
  res.status(202).json({ campaign, message: 'Campaign is running with configured delay controls.' });
}));

export default router;
