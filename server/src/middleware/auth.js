import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { db } from '../db/database.js';
import { ApiError } from '../utils/http.js';

export function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, env.jwtSecret, { expiresIn: '7d' });
}

export function authRequired(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(new ApiError(401, 'Authentication required'));
  try {
    const payload = jwt.verify(token, env.jwtSecret);
    const user = db.prepare('SELECT id, name, email, created_at FROM users WHERE id = ?').get(payload.sub);
    if (!user) return next(new ApiError(401, 'User no longer exists'));
    req.user = user;
    return next();
  } catch {
    return next(new ApiError(401, 'Invalid or expired token'));
  }
}
