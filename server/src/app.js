import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ZodError } from 'zod';
import { env } from './config/env.js';
import { apiLimiter } from './middleware/security.js';
import { authRequired } from './middleware/auth.js';
import { notFound, errorHandler } from './middleware/error.js';
import authRoutes from './routes/authRoutes.js';
import leadRoutes from './routes/leadRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import campaignRoutes from './routes/campaignRoutes.js';
import whatsappRoutes from './routes/whatsappRoutes.js';
import emailRoutes from './routes/emailRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import connectionRoutes from './routes/connectionRoutes.js';
import mvpRoutes from './routes/mvpRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDist = path.resolve(__dirname, '../../client/dist');

export const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));
const allowedOrigins = env.corsOrigin.split(',').map((o) => o.trim());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const replitDomain = process.env.REPLIT_DEV_DOMAIN;
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (replitDomain && origin.endsWith('.replit.dev')) return callback(null, true);
    if (replitDomain && origin.includes(replitDomain)) return callback(null, true);
    return callback(null, true);
  },
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(apiLimiter);

app.get('/health', (_req, res) => res.json({ status: 'ok', name: 'FlowAI API', time: new Date().toISOString() }));
app.use('/', authRoutes);
app.use('/dashboard', authRequired, dashboardRoutes);
app.use('/leads', authRequired, leadRoutes);
app.use('/ai', authRequired, aiRoutes);
app.use('/campaigns', authRequired, campaignRoutes);
app.use('/whatsapp', authRequired, whatsappRoutes);
app.use('/email', authRequired, emailRoutes);
app.use('/connections', connectionRoutes);
app.use('/mvp', authRequired, mvpRoutes);

if (env.nodeEnv === 'production' && fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

app.use((err, req, res, next) => {
  if (err instanceof ZodError) {
    err.status = 400;
    err.message = 'Validation failed';
    err.details = err.errors;
  }
  next(err);
});
app.use(notFound);
app.use(errorHandler);
