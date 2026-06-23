import { generateText } from './aiService.js';

const STACK_DETAILS = {
  react_node:   { frontend: 'React 18 + Vite + Tailwind CSS', backend: 'Node.js + Express', db: 'PostgreSQL / SQLite', deploy: 'Render / Railway / Vercel' },
  next:         { frontend: 'Next.js 14 (App Router)', backend: 'Next.js API Routes', db: 'PostgreSQL / Prisma', deploy: 'Vercel / Netlify' },
  vue_laravel:  { frontend: 'Vue 3 + Inertia.js', backend: 'Laravel 11', db: 'MySQL / PostgreSQL', deploy: 'Forge / DigitalOcean' },
  flutter:      { frontend: 'Flutter 3 (iOS + Android)', backend: 'Firebase / Supabase', db: 'Firestore / PostgreSQL', deploy: 'App Store / Play Store' },
  react_native: { frontend: 'React Native + Expo', backend: 'Node.js / Supabase', db: 'PostgreSQL / SQLite', deploy: 'App Store / Play Store' },
  python:       { frontend: 'React + TailwindCSS', backend: 'FastAPI + Python 3.11', db: 'PostgreSQL', deploy: 'Render / Railway' },
};

const BUDGET_RATES = {
  bootstrap: { hourly: 25,  total: '< $5,000',   hours: '80–160 hours' },
  startup:   { hourly: 75,  total: '$5k – $25k',  hours: '100–250 hours' },
  funded:    { hourly: 120, total: '$25k – $100k', hours: '200–600 hours' },
  enterprise:{ hourly: 175, total: '$100k+',       hours: '600+ hours' },
};

export async function generateMVPProposal(userId, { name, description, category, stack, budget, timeline, targetUsers }) {
  const stackInfo = STACK_DETAILS[stack] || STACK_DETAILS.react_node;
  const budgetInfo = BUDGET_RATES[budget] || BUDGET_RATES.startup;

  const prompt = `You are a senior software architect and business consultant. Generate a comprehensive MVP project proposal.

PROJECT DETAILS:
- Name: ${name}
- Description: ${description}
- Category: ${category}
- Target users: ${targetUsers || 'general users'}
- Tech stack: ${stackInfo.frontend} / ${stackInfo.backend} / ${stackInfo.db}
- Budget: ${budgetInfo.total} (${budgetInfo.hours})
- Timeline: ${timeline}

Generate a professional MVP proposal as a JSON object with EXACTLY these fields:
{
  "projectName": "string",
  "summary": "3-4 paragraph executive summary of the project, value proposition, and market opportunity",
  "features": [
    { "name": "Feature Name", "description": "Brief description", "priority": "MVP|Phase2|Future" }
  ],
  "techStack": [
    { "name": "Technology", "reason": "Why this technology was chosen" }
  ],
  "timeline": "Detailed week-by-week or phase breakdown as a string",
  "pricing": "Detailed cost breakdown and pricing estimate as a string",
  "gettingStarted": "Step-by-step guide to start development",
  "risks": [
    { "name": "Risk", "mitigation": "How to address it" }
  ]
}

Be specific, practical, and professional. Include 6-10 core features, full tech stack, realistic timeline phases, and detailed pricing. Return ONLY valid JSON.`;

  try {
    const result = await generateText(prompt, 'You are a senior software architect and business consultant. Return valid JSON only.', userId);
    const raw = result.text || '';

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI did not return valid JSON');

    const proposal = JSON.parse(jsonMatch[0]);

    if (!proposal.techStack || !Array.isArray(proposal.techStack)) {
      proposal.techStack = [
        { name: stackInfo.frontend, reason: 'Modern, fast, developer-friendly frontend' },
        { name: stackInfo.backend, reason: 'Scalable, well-supported backend' },
        { name: stackInfo.db, reason: 'Reliable relational database' },
        { name: stackInfo.deploy, reason: 'Simple deployment with CI/CD' },
      ];
    }

    return { proposal, provider: result.provider };
  } catch (err) {
    return {
      proposal: generateFallbackProposal({ name, description, category, stack, budget, timeline, targetUsers, stackInfo, budgetInfo }),
      provider: 'fallback',
    };
  }
}

function generateFallbackProposal({ name, description, category, targetUsers, stackInfo, budgetInfo }) {
  return {
    projectName: name,
    summary: `${name} is a ${category.toLowerCase()} designed for ${targetUsers || 'end users'}. ${description}\n\nThis MVP proposal outlines a lean, focused first version that validates core assumptions and delivers immediate value to early adopters. The project will be built with proven technologies ensuring rapid development and easy scalability.\n\nThe goal is to ship a working product within the proposed timeline, gather real user feedback, and iterate quickly. The tech stack has been chosen for developer productivity, community support, and long-term maintainability.`,
    features: [
      { name: 'User Authentication', description: 'Secure signup, login, password reset via email', priority: 'MVP' },
      { name: 'Core Dashboard', description: 'Main user interface with key metrics and navigation', priority: 'MVP' },
      { name: 'Primary Feature', description: `Core functionality as described: ${description.slice(0, 80)}…`, priority: 'MVP' },
      { name: 'Data Management', description: 'CRUD operations for the main data entities', priority: 'MVP' },
      { name: 'Notifications', description: 'Email and in-app notifications for key events', priority: 'MVP' },
      { name: 'Admin Panel', description: 'Basic admin interface for managing users and content', priority: 'Phase2' },
      { name: 'Analytics', description: 'Usage tracking and basic reporting dashboard', priority: 'Phase2' },
      { name: 'API & Integrations', description: 'RESTful API for third-party integrations', priority: 'Future' },
    ],
    techStack: [
      { name: stackInfo.frontend, reason: 'Modern, performant, large ecosystem' },
      { name: stackInfo.backend, reason: 'Proven, scalable, excellent documentation' },
      { name: stackInfo.db, reason: 'ACID compliant, reliable, easy to scale' },
      { name: 'Redis', reason: 'Session management and caching layer' },
      { name: stackInfo.deploy, reason: 'One-click deploys, free tier, auto-scaling' },
    ],
    timeline: `Phase 1 — Foundation (Weeks 1–2)\n• Project setup, CI/CD pipeline, auth system\n• Database schema design and migrations\n• Basic UI components and design system\n\nPhase 2 — Core Features (Weeks 3–5)\n• Primary feature development\n• API endpoints and data layer\n• Frontend pages and workflows\n\nPhase 3 — Polish & Launch (Weeks 6–8)\n• Testing, bug fixes, performance optimization\n• Onboarding flow and documentation\n• Production deployment and monitoring\n\nTotal estimated time: ${budgetInfo.hours}`,
    pricing: `Development Cost Estimate\n\n• Phase 1 (Foundation): ${Math.round(budgetInfo.hourly * 30)} – ${Math.round(budgetInfo.hourly * 50)}\n• Phase 2 (Core Features): ${Math.round(budgetInfo.hourly * 50)} – ${Math.round(budgetInfo.hourly * 90)}\n• Phase 3 (Polish & Launch): ${Math.round(budgetInfo.hourly * 20)} – ${Math.round(budgetInfo.hourly * 40)}\n\nTotal estimate: ${budgetInfo.total}\nBased on ${budgetInfo.hourly}/hr · ${budgetInfo.hours}\n\nInfrastructure (monthly):\n• Hosting: $0–$25/mo (free tiers available)\n• Database: $0–$20/mo\n• Monitoring: $0/mo (free tools)\n• Total infra: ~$0–$45/mo for MVP`,
    gettingStarted: `1. Clone project repository and install dependencies\n2. Configure environment variables (DB, auth, email)\n3. Run database migrations\n4. Start development server\n5. Deploy to ${stackInfo.deploy}\n\nFirst 3 priorities:\n→ Get authentication working end-to-end\n→ Build the core feature with real data\n→ Deploy a staging environment for testing`,
    risks: [
      { name: 'Scope creep', mitigation: 'Strict MVP feature list — any additions go to Phase 2 backlog' },
      { name: 'Tech debt', mitigation: 'Code reviews, tests from day 1, documented architecture' },
      { name: 'User adoption', mitigation: 'Launch with 10 beta users before full release, iterate weekly' },
    ],
  };
}
