import bcrypt from 'bcryptjs';
import { db, migrate } from './database.js';
import { nowIso } from '../utils/time.js';

migrate();

const email = process.env.SEED_EMAIL;
const password = process.env.SEED_PASSWORD;
const name = process.env.SEED_NAME || 'FlowAI Owner';

if (!email || !password) {
  console.log('No seed account created. This production build does not insert demo/mock leads. Register from the UI, or run with SEED_EMAIL and SEED_PASSWORD to create an owner account.');
  process.exit(0);
}

if (password.length < 8) {
  console.error('SEED_PASSWORD must be at least 8 characters.');
  process.exit(1);
}

const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
if (existing) {
  console.log(`Owner account already exists: ${email}`);
  process.exit(0);
}

const passwordHash = bcrypt.hashSync(password, 12);
db.prepare('INSERT INTO users (name, email, password_hash, created_at) VALUES (?, ?, ?, ?)')
  .run(name, email.toLowerCase(), passwordHash, nowIso());

console.log(`Owner account created: ${email}. No leads were inserted.`);
