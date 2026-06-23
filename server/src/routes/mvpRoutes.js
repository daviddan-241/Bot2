import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/http.js';
import { generateMVPProposal } from '../services/mvpService.js';

const router = Router();

router.post('/generate', asyncHandler(async (req, res) => {
  const schema = z.object({
    name:        z.string().min(2).max(100),
    description: z.string().min(10).max(3000),
    category:    z.string().optional().default('SaaS Platform'),
    stack:       z.string().optional().default('react_node'),
    budget:      z.enum(['bootstrap','startup','funded','enterprise']).default('startup'),
    timeline:    z.string().optional().default('8weeks'),
    targetUsers: z.string().optional().default(''),
  });
  const input = schema.parse(req.body);
  const result = await generateMVPProposal(req.user.id, input);
  res.json(result);
}));

export default router;
