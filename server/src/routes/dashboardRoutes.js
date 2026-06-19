import { Router } from 'express';
import { dashboardSummary } from '../services/leadService.js';

const router = Router();
router.get('/', (req, res) => res.json(dashboardSummary(req.user.id)));
export default router;
