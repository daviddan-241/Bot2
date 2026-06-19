# LeadFlow AI

LeadFlow AI is a full-stack Apollo.io-style AI CRM + legal lead generation + outreach automation platform for personal use, structured like a SaaS product.

## Stack

- Backend: Node.js, Express, SQLite (`better-sqlite3`), modular services
- Frontend: React + Vite + Tailwind CSS, mobile-first SaaS UI
- Auth: JWT + bcrypt password hashing
- AI: Ollama primary, Groq fallback, HuggingFace fallback, deterministic rule engine final fallback
- Scraping: legal search APIs (Serper, Brave, Bing) + public website scraping with robots.txt respect
- Outreach: Nodemailer SMTP email + WhatsApp Cloud API when configured, otherwise click-to-chat links

## Features implemented

- JWT register/login with user isolation
- SQLite persistence for users, leads, campaigns, campaign leads, AI cache, scrape jobs, email logs, WhatsApp logs
- Lead CRUD with automatic enrichment, WhatsApp normalization, AI/rule scoring
- Lead score badges: Hot (80-100), Warm (50-79), Cold (0-49)
- Legal lead discovery pipeline:
  1. search APIs only (Serper/Brave/Bing)
  2. public website + contact page fetch
  3. robots.txt check
  4. email/phone/social extraction
  5. AI/company analysis + scoring
  6. persisted leads
- AI endpoints:
  - `POST /ai/generate-message`
  - `POST /ai/score-lead`
  - `POST /ai/analyze-company`
  - `POST /ai/chat`
- Email endpoints with SMTP delivery, Gmail OAuth site connection, and delay-capable queue
- WhatsApp validation and official Meta Cloud API send/link flow
- Site-managed encrypted Connections page for email, AI, search/maps, and WhatsApp credentials
- Google Places API support plus Serper/Brave/Bing and free OpenStreetMap/Overpass discovery
- Worldwide auto-discovery presets: America + Europe, North America, Europe, Latin America, Africa, Middle East, Asia Pacific, Oceania, and Global
- Campaign create, assign leads, AI message generation, delayed send run
- Dashboard, Leads, Lead Detail, Scraper, Campaigns, AI Brain, Connections UI
- Global workspace settings for country, timezone, locale, and currency
- Worldwide phone normalization: any +country-code number works, local numbers use the user's selected country
- Dark/light mode, desktop sidebar, mobile iOS-style bottom navigation

## Preview

A static preview image is included at `preview.png`.

The public landing page is Squibb-inspired: large AI lead-intelligence hero, dark product mockup, workflow sections, agent block, pricing-ready cards, and a clean conversion CTA. The app itself remains a full CRM behind login.

## Quick start

### 1. Backend

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

API starts on `http://localhost:5000`.

### 2. Frontend

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

UI starts on `http://localhost:5173`.

### 3. Create your account

Register from the UI. The production build does **not** insert demo, mock, simulated, or fake leads.

If you want to create an owner account from the terminal without inserting leads:

```bash
cd server
SEED_EMAIL=you@example.com SEED_PASSWORD='StrongPassword123!' npm run seed
```

## Required configuration for real integrations

The app never uses fake provider results. If a provider is not configured, the relevant action fails safely or falls back only where explicitly designed.

Most provider credentials can now be added from the in-app **Connections** page instead of `.env`. They are encrypted in SQLite and scoped to the signed-in user. `.env` values remain available as optional server-wide defaults.

### In-app Connections page

Open **Connections** in the sidebar/bottom nav to configure:

- Global country/timezone/locale/currency settings
- Gmail OAuth sign-in or SMTP credentials
- Ollama/Groq/HuggingFace AI providers
- Google Places, Serper, Brave, Bing, and OpenStreetMap/Overpass discovery
- Meta WhatsApp Cloud API credentials

No provider is simulated. Email tests send real email, search tests call real APIs, and WhatsApp sends use the official Cloud API when connected. Without WhatsApp API credentials, LeadFlow generates real `wa.me` click-to-chat links only.

### AI

Local Ollama is primary:

```bash
ollama pull llama3
ollama serve
```

`.env`:

```env
OLLAMA_URL=http://localhost:11434/api/generate
OLLAMA_MODEL=llama3
```

Fallbacks:

```env
GROQ_API_KEY=your_groq_key
GROQ_MODEL=llama-3.1-8b-instant
HUGGINGFACE_API_KEY=your_hf_key
HUGGINGFACE_MODEL=mistralai/Mistral-7B-Instruct-v0.2
```

If all AI providers are unavailable, deterministic rule-based scoring/templates still work.

### Legal search APIs

Configured from the Connections page or `.env`:

```env
SERPER_API_KEY=your_serper_key
BRAVE_SEARCH_API_KEY=your_brave_key
BING_SEARCH_API_KEY=your_bing_key
```

The Connections page also supports Google Places API and a free OpenStreetMap/Overpass fallback. Google Places is official and real, but Google may require billing on your Google Cloud account. The scraper does **not** scrape Google Maps HTML or protected platforms.

### Email / Gmail

Preferred: use the in-app Connections page.

For Gmail OAuth from the site:

1. Create a Google OAuth client in Google Cloud.
2. Add the redirect URI shown in LeadFlow, usually `http://localhost:5000/connections/gmail/oauth/callback`.
3. Save Client ID/Secret in Connections.
4. Click **Sign in Google**.

SMTP can also be configured from the site or `.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=you@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM="LeadFlow AI <you@gmail.com>"
EMAIL_QUEUE_DELAY_MS=2500
```

For Gmail, use an App Password.

### WhatsApp

WhatsApp credentials can be saved from the Connections page. Without WhatsApp Cloud API keys, LeadFlow creates real `wa.me` click-to-chat links. It does not use unofficial WhatsApp Web automation. With keys, it sends through Meta Cloud API:

```env
WHATSAPP_ACCESS_TOKEN=your_meta_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
```

Optional custom validation provider:

```env
WHATSAPP_VERIFY_URL=https://your-approved-validation-provider.example/validate
```

## API map

### Auth

- `POST /register`
- `POST /login`
- `GET /me`

### Dashboard

- `GET /dashboard`

### Leads

- `GET /leads`
- `POST /leads`
- `GET /leads/:id`
- `PUT /leads/:id`
- `DELETE /leads/:id`
- `POST /leads/:id/score`
- `POST /leads/score` (bulk IDs or transient lead object)
- `POST /leads/scrape` (supports worldwide region presets: America + Europe, North America, Europe, Latin America, Africa, Middle East, Asia Pacific, Oceania, Global)
- `GET /leads/scrape/regions`
- `GET /leads/scrape/jobs`
- `GET /leads/scrape/:jobId`

### AI

- `GET /ai/providers/health`
- `POST /ai/generate-message`
- `POST /ai/score-lead`
- `POST /ai/analyze-company`
- `POST /ai/chat`

### Campaigns

- `GET /campaigns`
- `POST /campaigns`
- `GET /campaigns/:id`
- `POST /campaigns/:id/leads`
- `POST /campaigns/:id/run`

### Email

- `GET /email/health`
- `POST /email/send`
- `POST /email/bulk`

### WhatsApp

- `POST /whatsapp/validate`
- `POST /whatsapp/send`

### Connections

- `GET /connections`
- `PUT /connections/:provider` (`workspace`, `email`, `ai`, `search`, `whatsapp`)
- `POST /connections/:provider/test`
- `GET /connections/gmail/oauth/start`
- `GET /connections/gmail/oauth/callback`

## Security and compliance notes

- JWT is required for all business endpoints.
- Every query is scoped by `user_id`.
- Passwords are hashed with bcrypt.
- Express Helmet, CORS, rate limiting, input validation, and URL/email sanitization are included.
- Scraping uses legal search APIs and only public websites.
- robots.txt is checked before website fetches.
- Website crawling is intentionally shallow: homepage + one contact/about page.
- Campaign sends include delay controls to reduce spam-like behavior.

## Project structure

```text
leadflow-ai/
  server/
    src/
      config/        environment config
      db/            SQLite setup and seed
      middleware/    auth, security, errors
      routes/        Express API routes
      services/      AI, scoring, scraper, email, WhatsApp, campaigns, leads
      utils/         helpers
  client/
    src/
      components/    SaaS UI building blocks
      context/       auth state
      pages/         dashboard, leads, scraper, campaigns, AI
      utils/         API client
```

## Render deployment

See `RENDER_DEPLOY.md`.

Main files:

- `render.yaml` — recommended Render blueprint with persistent SQLite disk.
- `render-free-ephemeral.yaml` — optional free experiment blueprint; not recommended for real data persistence.

## WhatsApp free setup

See `WHATSAPP_FREE_GUIDE.md`.

Short version: Meta provides a free developer/test setup with a test WhatsApp Business Account and test phone number for limited verified recipients. Production WhatsApp sending requires official Meta Cloud API credentials and may involve Meta messaging charges. LeadFlow never uses unofficial WhatsApp Web automation.

## Production hardening checklist

Before internet-facing deployment:

- Replace `JWT_SECRET` with a long random secret.
- Use HTTPS and a production reverse proxy.
- Set exact `CORS_ORIGIN`.
- Back up the SQLite database or move to managed Postgres for multi-user scale.
- Add persistent background workers for very large campaigns.
- Add domain-level suppression lists and unsubscribe handling for outbound email.
- Review all outreach for consent and local anti-spam compliance.
