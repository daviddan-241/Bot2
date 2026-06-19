import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '../db/database.js';
import { signToken, authRequired } from '../middleware/auth.js';
import { authLimiter } from '../middleware/security.js';
import { asyncHandler, ApiError } from '../utils/http.js';
import { cleanText } from '../utils/sanitize.js';
import { nowIso } from '../utils/time.js';

const router = Router();
const registerSchema = z.object({ name: z.string().min(2).max(100), email: z.string().email(), password: z.string().min(8).max(128) });
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

router.post('/register', authLimiter, asyncHandler(async (req, res) => {
  const input = registerSchema.parse(req.body);
  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(input.email.toLowerCase());
  if (exists) throw new ApiError(409, 'Email is already registered');
  const passwordHash = await bcrypt.hash(input.password, 12);
  const result = db.prepare('INSERT INTO users (name, email, password_hash, created_at) VALUES (?, ?, ?, ?)')
    .run(cleanText(input.name, 100), input.email.toLowerCase(), passwordHash, nowIso());
  const user = db.prepare('SELECT id, name, email, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ user, token: signToken(user) });
}));

router.post('/login', authLimiter, asyncHandler(async (req, res) => {
  const input = loginSchema.parse(req.body);
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(input.email.toLowerCase());
  if (!row) throw new ApiError(401, 'Invalid email or password');
  const ok = await bcrypt.compare(input.password, row.password_hash);
  if (!ok) throw new ApiError(401, 'Invalid email or password');
  const user = { id: row.id, name: row.name, email: row.email, created_at: row.created_at };
  res.json({ user, token: signToken(user) });
}));

router.get('/me', authRequired, (req, res) => res.json({ user: req.user }));

export default router;
