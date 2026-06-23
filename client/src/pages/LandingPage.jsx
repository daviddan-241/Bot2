import { Link } from 'react-router-dom';
import { ArrowRight, Bot, Code2, Mail, MapPin, Sparkles, Zap, Check, ChevronRight, Star } from 'lucide-react';

const FEATURES = [
  {
    icon: MapPin, label: 'Lead Discovery',
    title: 'Find real leads worldwide',
    desc: 'Search Google Places, Serper, Brave, Bing, and OpenStreetMap. Every result is a real business with real contact data — no mocked records.',
    color: '#5c67ff',
  },
  {
    icon: Bot, label: 'AI Assistant',
    title: 'Powered by real AI',
    desc: 'Chat with Groq (Llama 3), HuggingFace, or local Ollama. Score leads, write outreach, generate proposals — all real AI, not templates.',
    color: '#7c3aed',
  },
  {
    icon: Code2, label: 'MVP Generator',
    title: 'Generate web project proposals',
    desc: 'Describe your MVP idea and get a full technical proposal, feature list, tech stack, timeline, and pricing — ready to send to clients.',
    color: '#06b6d4',
  },
  {
    icon: Mail, label: 'Email Outreach',
    title: 'Connect real Gmail or SMTP',
    desc: 'OAuth into Gmail or connect SMTP. Real email delivery with delay controls, AI-personalized copy, and delivery tracking.',
    color: '#10b981',
  },
];

const STATS = [
  { value: '100%', label: 'Real data sources' },
  { value: 'Free', label: 'Tools & APIs used' },
  { value: 'AI', label: 'Powered scoring' },
  { value: 'Global', label: 'Lead coverage' },
];

function FeatureCard({ icon: Icon, label, title, desc, color, delay = 0 }) {
  return (
    <div className="rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 group"
      style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)' }}>
      <div className="h-11 w-11 rounded-xl flex items-center justify-center mb-5"
        style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
        <Icon size={20} color={color} />
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color }}>{label}</p>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm leading-relaxed text-slate-400">{desc}</p>
    </div>
  );
}

function ChatPreview() {
  const msgs = [
    { role: 'user', text: 'Find dental clinics in Austin TX and score them' },
    { role: 'ai', text: 'Found 14 real dental clinics via Google Places & OpenStreetMap. Top lead: Smile Care Austin — score 84/100 (Hot). Website verified, email extracted. Ready to add to campaign?', provider: 'Groq Llama 3' },
    { role: 'user', text: 'Yes, add to email campaign and draft outreach' },
    { role: 'ai', text: 'Added 14 leads to "Austin Dental Q1" campaign. AI-personalized emails drafted using clinic name and specialty. Subject: "Quick question about [ClinicName]\'s new patient flow"', provider: 'Groq Llama 3' },
  ];

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#0d0d1a', border: '1px solid rgba(255,255,255,.08)' }}>
      <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,.06)' }}>
        <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#5c67ff,#7c3aed)' }}>
          <Bot size={13} color="white"/>
        </div>
        <span className="text-sm font-semibold text-white">FlowAI Assistant</span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400"/>
          <span className="text-[10px] text-emerald-400 font-medium">Live</span>
        </div>
      </div>
      <div className="p-4 space-y-3">
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
              m.role === 'user'
                ? 'text-white' : 'text-slate-300'}`}
              style={m.role === 'user'
                ? { background: 'rgba(92,103,255,.25)', border: '1px solid rgba(92,103,255,.3)' }
                : { background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)' }}>
              {m.text}
              {m.provider && <p className="mt-1.5 text-[9px] font-semibold uppercase tracking-wider" style={{ color: '#a5b0ff', opacity: 0.7 }}>{m.provider}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen min-h-dvh overflow-hidden" style={{ background: '#0A0A14', color: '#fff' }}>

      {/* Nav */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-5 py-4"
        style={{ background: 'rgba(10,10,20,.85)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#5c67ff,#7c3aed)', boxShadow: '0 4px 14px rgba(92,103,255,.4)' }}>
            <svg viewBox="0 0 24 24" fill="none" width="17" height="17">
              <path d="M12 3 L20 18 L12 14 L4 18 Z" fill="white" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-sm font-bold text-white">FlowAI</span>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm text-slate-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#ai" className="hover:text-white transition-colors">AI Chat</a>
          <a href="#generator" className="hover:text-white transition-colors">MVP Generator</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/login" className="btn-secondary text-xs px-3 py-2">Sign in</Link>
          <Link to="/login" className="btn-primary text-xs px-3 py-2">Get started free</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative px-5 pt-16 pb-20 text-center">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #5c67ff 0%, transparent 70%)', filter: 'blur(60px)' }}/>
          <div className="absolute top-20 left-1/4 w-[300px] h-[300px] rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)', filter: 'blur(80px)' }}/>
        </div>

        <div className="relative mx-auto max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 mb-7 text-xs font-semibold"
            style={{ background: 'rgba(92,103,255,.1)', border: '1px solid rgba(92,103,255,.25)', color: '#a5b0ff' }}>
            <Sparkles size={11}/> AI-powered · 100% real data · Completely free
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white mb-6 leading-[1.05]">
            Find leads, close deals,
            <br />
            <span style={{ background: 'linear-gradient(135deg, #5c67ff 0%, #a78bfa 50%, #06b6d4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              build products.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
            FlowAI combines real lead generation, AI-powered outreach, and an MVP project generator into one mobile-first platform. Every feature uses free, real tools — no mocks, no simulations.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/login" className="btn-primary px-6 py-3 text-base w-full sm:w-auto">
              Start for free <ArrowRight size={18}/>
            </Link>
            <a href="#features" className="btn-secondary px-6 py-3 text-base w-full sm:w-auto">
              See all features
            </a>
          </div>

          {/* Stats row */}
          <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto">
            {STATS.map(({ value, label }) => (
              <div key={label} className="rounded-xl py-3 px-4 text-center" style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)' }}>
                <p className="text-xl font-black text-white">{value}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Chat preview */}
      <section id="ai" className="px-5 py-16 max-w-5xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#7c3aed' }}>Real AI Chat</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-5 leading-tight">
              An AI assistant that actually works
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-7">
              Powered by Groq (Llama 3.1) and HuggingFace — both free. Ask it to find leads, score contacts, write personalized emails, or generate full project proposals. Real AI, real results.
            </p>
            <div className="space-y-3">
              {['Find businesses in any city worldwide', 'Score leads with AI + rule engine', 'Write personalized outreach copy', 'Generate MVP proposals on demand'].map(item => (
                <div key={item} className="flex items-center gap-3 text-sm text-slate-300">
                  <div className="h-5 w-5 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(92,103,255,.2)' }}>
                    <Check size={11} color="#a5b0ff"/>
                  </div>
                  {item}
                </div>
              ))}
            </div>
            <Link to="/login" className="btn-primary mt-8 inline-flex">
              Try AI chat free <ChevronRight size={16}/>
            </Link>
          </div>
          <div><ChatPreview /></div>
        </div>
      </section>

      {/* Features grid */}
      <section id="features" className="px-5 py-16 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#5c67ff' }}>Everything included</p>
          <h2 className="text-3xl sm:text-4xl font-black text-white">All the tools you need, all free</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {FEATURES.map((f, i) => <FeatureCard key={f.label} {...f} delay={i * 80}/>)}
        </div>
      </section>

      {/* MVP Generator section */}
      <section id="generator" className="px-5 py-16 max-w-5xl mx-auto">
        <div className="rounded-2xl p-8 sm:p-10 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(92,103,255,.15) 0%, rgba(124,58,237,.1) 100%)', border: '1px solid rgba(92,103,255,.2)' }}>
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #5c67ff 0%, transparent 70%)', filter: 'blur(40px)' }}/>
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-5 text-xs font-semibold" style={{ background: 'rgba(92,103,255,.2)', color: '#a5b0ff' }}>
              <Code2 size={12}/> New Feature
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">MVP Project Generator</h2>
            <p className="text-slate-300 text-sm leading-relaxed max-w-2xl mb-8">
              Describe your project idea and get a complete proposal: feature breakdown, tech stack recommendation, 8-week timeline, pricing estimate, and a full pitch deck ready to send to clients or investors.
            </p>
            <div className="grid sm:grid-cols-3 gap-3 mb-8">
              {['AI-generated proposal', 'Tech stack recommendations', 'Pricing & timeline'].map(item => (
                <div key={item} className="flex items-center gap-2 text-sm text-slate-300" style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, padding: '12px 14px' }}>
                  <Zap size={14} color="#a5b0ff"/>{item}
                </div>
              ))}
            </div>
            <Link to="/login" className="btn-primary">Generate your MVP proposal <ArrowRight size={16}/></Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 py-16 text-center max-w-2xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Ready to build your pipeline?</h2>
        <p className="text-slate-400 text-sm mb-8">Join today. Everything is free — real leads, real AI, real outreach.</p>
        <Link to="/login" className="btn-primary px-8 py-3 text-base">
          Get started free <ArrowRight size={18}/>
        </Link>
      </section>

      {/* Footer */}
      <footer className="px-5 py-8" style={{ borderTop: '1px solid rgba(255,255,255,.06)' }}>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#5c67ff,#7c3aed)' }}>
              <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                <path d="M12 3 L20 18 L12 14 L4 18 Z" fill="white"/>
              </svg>
            </div>
            <span className="text-sm font-bold text-white">FlowAI</span>
          </div>
          <p className="text-xs text-slate-500">Real data · Real AI · No mocks · Free tools only</p>
          <Link to="/login" className="btn-secondary text-xs">Open app</Link>
        </div>
      </footer>
    </div>
  );
}
