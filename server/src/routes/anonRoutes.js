import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/http.js';
import { chat } from '../services/aiService.js';

const router = Router();

const limiter = new Map();
function anonRateLimit(req, res, next) {
  const ip = req.ip || 'unknown';
  const now = Date.now();
  const entry = limiter.get(ip) || { count: 0, reset: now + 60_000 };
  if (now > entry.reset) { entry.count = 0; entry.reset = now + 60_000; }
  entry.count++;
  limiter.set(ip, entry);
  if (entry.count > 8) return res.status(429).json({ error: 'Too many requests. Sign up for unlimited access.' });
  next();
}

router.post('/chat', anonRateLimit, asyncHandler(async (req, res) => {
  const schema = z.object({
    messages: z.array(z.object({
      role: z.enum(['user', 'assistant', 'system']).default('user'),
      content: z.string().max(2000),
    })).min(1).max(6),
  });
  const { messages } = schema.parse(req.body);
  const system = {
    role: 'system',
    content: `You are FlowAI, an AI-powered lead generation and outreach assistant — like Apollo.io but with AI chat.
You help users find real business leads, score them, send personalized emails, and automate outreach.
Keep answers concise (2-4 sentences). Be helpful, direct, and impressive.
If asked to find leads or run a pipeline, explain what FlowAI would do and ask them to sign up to run it for real.
Never make up specific data. Always end with a call to action to sign up or try the full app.`,
  };
  const result = await chat(null, [system, ...messages]);
  res.json(result);
}));

export default router;
