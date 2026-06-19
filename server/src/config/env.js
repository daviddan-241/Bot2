import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const bool = (value, fallback = false) => {
  if (value === undefined || value === '') return fallback;
  return ['true', '1', 'yes', 'on'].includes(String(value).toLowerCase());
};

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  jwtSecret: process.env.JWT_SECRET || 'dev-only-change-me',
  dbPath: process.env.DB_PATH || './data/leadflow.sqlite',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  defaultCountry: process.env.DEFAULT_COUNTRY || 'NG',

  ollamaUrl: process.env.OLLAMA_URL || 'http://localhost:11434/api/generate',
  ollamaModel: process.env.OLLAMA_MODEL || 'llama3',
  groqApiKey: process.env.GROQ_API_KEY || '',
  groqModel: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
  hfApiKey: process.env.HUGGINGFACE_API_KEY || '',
  hfModel: process.env.HUGGINGFACE_MODEL || 'mistralai/Mistral-7B-Instruct-v0.2',

  serperApiKey: process.env.SERPER_API_KEY || '',
  braveSearchApiKey: process.env.BRAVE_SEARCH_API_KEY || '',
  bingSearchApiKey: process.env.BING_SEARCH_API_KEY || '',

  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpSecure: bool(process.env.SMTP_SECURE, false),
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  smtpFrom: process.env.SMTP_FROM || 'LeadFlow AI <no-reply@leadflow.local>',
  emailQueueDelayMs: Number(process.env.EMAIL_QUEUE_DELAY_MS || 2500),

  whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
  whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
  whatsappVerifyUrl: process.env.WHATSAPP_VERIFY_URL || '',
};
