import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/http.js';
import { generateMessage, scoreLead, analyzeCompany, chat, providerHealth } from '../services/aiService.js';

const router = Router();

router.get('/providers/health', asyncHandler(async (req, res) => {
  res.json({ providers: await providerHealth(req.user.id) });
}));

router.post('/generate-message', asyncHandler(async (req, res) => {
  const schema = z.object({ lead: z.record(z.any()), tone: z.string().optional(), channel: z.string().optional(), offer: z.string().optional() });
  const input = schema.parse(req.body);
  const result = await generateMessage(req.user.id, input);
  res.json(result);
}));

router.post('/score-lead', asyncHandler(async (req, res) => {
  const schema = z.object({ lead: z.record(z.any()) });
  const input = schema.parse(req.body);
  const result = await scoreLead(req.user.id, input.lead);
  res.json(result);
}));

router.post('/analyze-company', asyncHandler(async (req, res) => {
  const schema = z.object({ name: z.string().optional(), company: z.string().optional(), website: z.string().optional(), email: z.string().optional(), text: z.string().optional() });
  const input = schema.parse(req.body);
  const result = await analyzeCompany(req.user.id, input);
  res.json(result);
}));

router.post('/chat', asyncHandler(async (req, res) => {
  const schema = z.object({ messages: z.array(z.object({ role: z.enum(['user', 'assistant', 'system']).default('user'), content: z.string().max(8000) })).min(1) });
  const input = schema.parse(req.body);
  const result = await chat(req.user.id, input.messages);
  res.json(result);
}));

export default router;
