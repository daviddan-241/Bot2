import { Link } from 'react-router-dom';
import { ArrowRight, Bot, Check, Mail, MapPinned, Play, Sparkles, Workflow } from 'lucide-react';

function AppPreview() {
  const rows = [
    ['Live discovery', 'API results only', 'Google Places / OSM / Search APIs'],
    ['Website enrichment', 'Public pages only', 'robots.txt respected'],
    ['Outreach routing', 'Official channels', 'Gmail/SMTP + WhatsApp Cloud/API links'],
  ];
  return (
    <div className="relative mx-auto max-w-5xl rounded-[34px] border border-white/15 bg-slate-950/95 p-3 shadow-[0_40px_140px_rgba(15,23,42,.45)]">
      <div className="overflow-hidden rounded-[26px] border border-white/10 bg-[#080d19]">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-red-400"/><span className="h-3 w-3 rounded-full bg-amber-400"/><span className="h-3 w-3 rounded-full bg-emerald-400"/></div>
          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs font-bold text-slate-300">leadflow.ai/app</div>
        </div>
        <div className="grid gap-4 p-4 lg:grid-cols-[240px_1fr]">
          <aside className="hidden rounded-3xl border border-white/10 bg-white/[.03] p-4 lg:block">
            <div className="mb-5 flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-600 font-black text-white">LF</div><div><p className="text-sm font-black text-white">LeadFlow</p><p className="text-xs text-slate-500">Real-source CRM</p></div></div>
            {['Command', 'Discover', 'Campaigns', 'Connections'].map((x, i) => <div key={x} className={`mb-2 rounded-2xl px-4 py-3 text-sm font-bold ${i === 0 ? 'bg-white text-slate-950' : 'text-slate-400'}`}>{x}</div>)}
          </aside>
          <main className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              {[
                ['Sources', 'Live APIs', 'no mock records'],
                ['Coverage', 'Worldwide', 'America, Europe, etc.'],
                ['Sending', 'Official', 'no fake delivery'],
              ].map(([a,b,c]) => <div key={a} className="rounded-3xl border border-white/10 bg-white/[.04] p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{a}</p><p className="mt-2 text-2xl font-black text-white">{b}</p><p className="mt-1 text-xs text-emerald-300">{c}</p></div>)}
            </div>
            <div className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
              <div className="rounded-3xl border border-white/10 bg-white/[.04] p-4">
                <div className="mb-4 flex items-center justify-between"><h4 className="font-black text-white">Real lead pipeline</h4><span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">provider-backed</span></div>
                <div className="space-y-3">{rows.map(([name, status, detail]) => <div key={name} className="flex items-center justify-between gap-3 rounded-2xl bg-white/[.04] p-3"><div><p className="font-bold text-white">{name}</p><p className="text-xs text-slate-500">{detail}</p></div><div className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-black text-blue-200">{status}</div></div>)}</div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-blue-600 to-indigo-600 p-5 text-white">
                <Sparkles className="mb-4"/>
                <p className="text-xl font-black">Global workflow</p>
                <p className="mt-2 text-sm leading-6 text-blue-100">Choose America + Europe, Europe, North America, Africa, Asia Pacific, Latin America, Middle East, Oceania, or custom locations.</p>
                <div className="mt-5 space-y-2 text-sm font-bold">{['Real APIs only', 'Public-site enrichment', 'Human-safe outreach'].map((x) => <div key={x} className="flex items-center gap-2"><Check size={16}/> {x}</div>)}</div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function Step({ number, tag, title, text, icon: Icon }) {
  return (
    <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-soft dark:border-white/10 dark:bg-slate-900">
      <div className="mb-5 flex items-center justify-between"><span className="text-4xl font-black text-slate-200 dark:text-white/10">{number}</span><div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300"><Icon/></div></div>
      <p className="text-xs font-black uppercase tracking-[.22em] text-blue-600">{tag}</p>
      <h3 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">{text}</p>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#f7f8fb] text-slate-950 dark:bg-[#080d19] dark:text-white">
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/75 backdrop-blur-2xl dark:border-white/10 dark:bg-[#080d19]/75">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-600 text-sm font-black text-white shadow-glow">LF</div><div><p className="font-black leading-4">LeadFlow AI</p><p className="text-xs text-slate-500">Lead engine</p></div></Link>
          <nav className="hidden items-center gap-6 text-sm font-bold text-slate-600 dark:text-slate-300 md:flex"><a href="#features">How it works</a><a href="#agent">Agent</a><a href="#deployment">Deployment</a></nav>
          <div className="flex items-center gap-2"><Link to="/login" className="btn-secondary !rounded-full">Login</Link><Link to="/login" className="btn-primary !rounded-full">Get started</Link></div>
        </div>
      </header>

      <section className="relative px-4 pb-16 pt-16 sm:pt-24">
        <div className="absolute left-1/2 top-0 h-[620px] w-[620px] -translate-x-1/2 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-[.18em] text-blue-700 shadow-sm dark:border-blue-500/20 dark:bg-white/5 dark:text-blue-300"><Sparkles size={14}/> AI-powered lead intelligence</div>
          <h1 className="mx-auto max-w-5xl text-5xl font-black tracking-[-.06em] text-slate-950 dark:text-white sm:text-7xl lg:text-8xl">Find leads and launch outreach without spreadsheet chaos.</h1>
          <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">LeadFlow discovers businesses through legal APIs, enriches public websites, scores buying fit with AI, and prepares email + WhatsApp outreach from one clean command center.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Link to="/login" className="btn-primary !rounded-full !px-6 !py-3">Start building pipeline <ArrowRight size={18}/></Link><a href="#features" className="btn-secondary !rounded-full !px-6 !py-3"><Play size={18}/> See how it works</a></div>
          <div className="mt-14"><AppPreview /></div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-4 py-20">
        <div className="mb-10 max-w-2xl"><p className="text-sm font-black uppercase tracking-[.22em] text-blue-600">How it works</p><h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">From search to pipeline in minutes</h2></div>
        <div className="grid gap-5 md:grid-cols-3">
          <Step number="01" tag="Find" icon={MapPinned} title="Business discovery" text="Use Google Places, Serper, Brave, Bing, or free OpenStreetMap discovery to find real businesses by niche and location." />
          <Step number="02" tag="Engage" icon={Mail} title="Outreach campaigns" text="Generate personalized email and WhatsApp copy, then send through connected SMTP/Gmail or official WhatsApp Cloud API." />
          <Step number="03" tag="Convert" icon={Workflow} title="Scored workflows" text="Every lead is cleaned, enriched, scored, and routed into campaigns with delay controls and delivery tracking." />
        </div>
      </section>

      <section id="agent" className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid items-center gap-8 rounded-[40px] border border-slate-200 bg-white p-6 shadow-soft dark:border-white/10 dark:bg-slate-900 lg:grid-cols-[1fr_.8fr] lg:p-10">
          <div><p className="text-sm font-black uppercase tracking-[.22em] text-blue-600">Meet the agent</p><h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Lead generation on autopilot, with human approval.</h2><p className="mt-5 max-w-2xl text-sm leading-8 text-slate-500 dark:text-slate-400">Ask for prospects in plain language. LeadFlow searches legal sources, enriches websites, explains lead scores, writes messages, and queues outreach with guardrails.</p><div className="mt-6 grid gap-3 sm:grid-cols-3">{['AI search brief', 'Smart scoring', 'Real integrations'].map((x) => <div key={x} className="rounded-2xl bg-slate-50 p-4 text-sm font-black dark:bg-white/5"><Check className="mb-2 text-emerald-500" size={18}/>{x}</div>)}</div></div>
          <div className="relative"><div className="mx-auto grid aspect-square max-w-sm place-items-center rounded-[42px] bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-950 p-8 text-center text-white shadow-glow"><Bot size={68}/><div><p className="mt-5 text-2xl font-black">Agent LeadFlow</p><p className="mt-2 text-sm leading-6 text-blue-100">“Find clinics across America + Europe and draft compliant outreach.”</p></div></div></div>
        </div>
      </section>

      <section id="deployment" className="mx-auto max-w-7xl px-4 py-20">
        <div className="mb-10 text-center"><p className="text-sm font-black uppercase tracking-[.22em] text-blue-600">Production setup</p><h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Connect real providers, then deploy</h2></div>
        <div className="grid gap-5 md:grid-cols-3">{[
          ['Real discovery', 'Provider-backed', ['OpenStreetMap/Overpass', 'Google Places API', 'Serper / Brave / Bing']],
          ['Real outreach', 'Official channels', ['Gmail OAuth or SMTP', 'Meta WhatsApp Cloud API', 'wa.me manual-send fallback']],
          ['Render-ready', 'Persistent SaaS', ['SQLite persistent disk', 'JWT user isolation', 'Encrypted connections']],
        ].map(([name, mode, items], i) => <div key={name} className={`rounded-[30px] border p-6 ${i === 1 ? 'border-blue-300 bg-blue-600 text-white shadow-glow' : 'border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900'}`}><p className="text-lg font-black">{name}</p><p className="mt-3 text-2xl font-black">{mode}</p><div className="mt-6 space-y-3 text-sm">{items.map((x) => <p key={x} className="flex items-center gap-2"><Check size={16}/> {x}</p>)}</div></div>)}</div>
      </section>

      <footer className="border-t border-slate-200 bg-white px-4 py-10 dark:border-white/10 dark:bg-[#080d19]"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 sm:flex-row sm:items-center"><p className="font-black">LeadFlow AI</p><p className="text-sm text-slate-500">Original Squibb-inspired design. No copied assets, no fake provider results.</p><Link to="/login" className="btn-primary !rounded-full">Open app</Link></div></footer>
    </div>
  );
}
