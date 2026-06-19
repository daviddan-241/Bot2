import { env } from '../config/env.js';

export function notFound(req, _res, next) {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.status = 404;
  next(error);
}

export function errorHandler(err, _req, res, _next) {
  const status = err.status || 500;
  const payload = {
    error: err.message || 'Internal server error',
    details: err.details,
  };
  if (env.nodeEnv !== 'production') payload.stack = err.stack;
  res.status(status).json(payload);
}
