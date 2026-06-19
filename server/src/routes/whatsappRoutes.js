import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, ApiError } from '../utils/http.js';
import { validateWhatsAppNumber, sendWhatsApp } from '../services/whatsappService.js';
import { getLead } from '../services/leadService.js';

const router = Router();

router.post('/validate', asyncHandler(async (req, res) => {
  const schema = z.object({ phone: z.string().optional(), leadId: z.number().optional(), country: z.string().length(2).optional() });
  const input = schema.parse(req.body);
  let phone = input.phone;
  if (input.leadId) {
    const lead = getLead(req.user.id, input.leadId);
    if (!lead) throw new ApiError(404, 'Lead not found');
    phone = lead.normalized_phone || lead.phone;
  }
  if (!phone) throw new ApiError(400, 'Phone is required');
  res.json(await validateWhatsAppNumber(req.user.id, phone, input.country));
}));

router.post('/send', asyncHandler(async (req, res) => {
  const schema = z.object({ leadId: z.number().optional(), phone: z.string().optional(), message: z.string().min(1).max(4000) });
  const input = schema.parse(req.body);
  let phone = input.phone;
  if (input.leadId) {
    const lead = getLead(req.user.id, input.leadId);
    if (!lead) throw new ApiError(404, 'Lead not found');
    phone = lead.normalized_phone || lead.phone;
  }
  if (!phone) throw new ApiError(400, 'Phone is required');
  const result = await sendWhatsApp({ userId: req.user.id, leadId: input.leadId || null, phone, message: input.message });
  res.json(result);
}));

export default router;
