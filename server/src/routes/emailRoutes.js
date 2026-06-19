import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, ApiError } from '../utils/http.js';
import { sendEmail, bulkEmail, emailHealth } from '../services/emailService.js';
import { generateMessage } from '../services/aiService.js';
import { getLead } from '../services/leadService.js';

const router = Router();

router.get('/health', (req, res) => res.json(emailHealth(req.user.id)));

router.post('/send', asyncHandler(async (req, res) => {
  const schema = z.object({ leadId: z.number().optional(), to: z.string().email().optional(), subject: z.string().min(1).max(200), html: z.string().optional(), text: z.string().optional() });
  const input = schema.parse(req.body);
  let to = input.to;
  if (input.leadId) {
    const lead = getLead(req.user.id, input.leadId);
    if (!lead) throw new ApiError(404, 'Lead not found');
    to = lead.email;
  }
  if (!to) throw new ApiError(400, 'Recipient email is required');
  const result = await sendEmail({ userId: req.user.id, leadId: input.leadId || null, to, subject: input.subject, html: input.html, text: input.text });
  res.json(result);
}));

router.post('/bulk', asyncHandler(async (req, res) => {
  const schema = z.object({ leadIds: z.array(z.number()).min(1), subject: z.string().max(200).optional(), tone: z.string().optional(), delayMs: z.number().min(1000).max(120000).optional() });
  const input = schema.parse(req.body);
  const leads = input.leadIds.map((id) => getLead(req.user.id, id)).filter(Boolean);
  const results = await bulkEmail({
    userId: req.user.id,
    leads,
    subject: input.subject || 'Quick idea',
    delayMs: input.delayMs,
    messageFactory: async (lead) => {
      const ai = await generateMessage(req.user.id, { lead, tone: input.tone || 'friendly', channel: 'email' });
      return { subject: input.subject || ai.subject, text: ai.message };
    }
  });
  res.json({ results });
}));

export default router;
