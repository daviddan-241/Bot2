import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/http.js';
import { generateMessage, scoreLead, analyzeCompany, chat, providerHealth } from '../services/aiService.js';
import { runAutoPipeline, buildPipelineMessage } from '../services/automationService.js';

const router = Router();

router.get('/providers/health', asyncHandler(async (req, res) => {
  res.json({ providers: await providerHealth(req.user.id) });
}));

router.post('/generate-message', asyncHandler(async (req, res) => {
  const schema = z.object({ lead: z.record(z.any()), tone: z.string().optional(), channel: z.string().optional(), offer: z.string().optional() });
  const input = schema.parse(req.body);
  res.json(await generateMessage(req.user.id, input));
}));

router.post('/score-lead', asyncHandler(async (req, res) => {
  const schema = z.object({ lead: z.record(z.any()) });
  const input = schema.parse(req.body);
  res.json(await scoreLead(req.user.id, input.lead));
}));

router.post('/analyze-company', asyncHandler(async (req, res) => {
  const schema = z.object({ name: z.string().optional(), company: z.string().optional(), website: z.string().optional(), email: z.string().optional(), text: z.string().optional() });
  const input = schema.parse(req.body);
  res.json(await analyzeCompany(req.user.id, input));
}));

router.post('/chat', asyncHandler(async (req, res) => {
  const schema = z.object({ messages: z.array(z.object({ role: z.enum(['user', 'assistant', 'system']).default('user'), content: z.string().max(8000) })).min(1) });
  const input = schema.parse(req.body);
  res.json(await chat(req.user.id, input.messages));
}));

router.post('/auto-pipeline', asyncHandler(async (req, res) => {
  const schema = z.object({ command: z.string().min(3).max(500) });
  const { command } = schema.parse(req.body);
  const results = await runAutoPipeline(req.user.id, command);
  const message = buildPipelineMessage(command, results);
  res.json({ message, provider: 'auto-pipeline', pipeline: results });
}));

export default router;
