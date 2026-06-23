import { Link } from 'react-router-dom';
import { ArrowRight, Bot, Check, Code2, Mail, MapPin, MessageCircle, Sparkles, Zap } from 'lucide-react';

const FEATURES = [
  {
    icon: MapPin, color: '#6366f1',
    title: 'Real lead discovery',
    desc: 'Google Places, OpenStreetMap, Serper, Brave Search. Every result is a real business with real contact data.',
  },
  {
    icon: Bot, color: '#8b5cf6',
    title: 'AI powered by Groq',
    desc: 'Llama 3.1 via Groq — completely free. Score leads, write outreach, chat, generate proposals.',
  },
  {
    icon: Code2, color: '#06b6d4',
    title: 'MVP project generator',
    desc: 'Describe your idea. Get a full tech proposal, timeline, feature list, and pricing ready to send.',
  },
  {
    icon: Mail, color: '#10b981',
    title: 'Gmail OAuth campaigns',
    desc: 'Connect your Gmail account and send real personalized outreach to your leads at scale.',
  },
  {
    icon: MessageCircle, color: '#f59e0b',
    title: 'WhatsApp integration',
    desc: 'Meta Cloud API for real sends, or wa.me click-to-chat links — always real, never simulated.',
  },
  {
    icon: Zap, color: '#ec4899',
    title: 'AI lead scoring',
    desc: 'Rule-based engine plus Groq AI refinement. Every lead gets a Hot / Warm / Cold score instantly.',
  },
];

const PROOF = [
  { n: '100%', label: 'Real data' },
  { n: 'Free', label: 'All tools' },
  { n: 'AI', label: 'Powered' },
  { n: '0', label: 'Mock data' },
];

const PLANS = [
  {
    name: 'Free forever',
    price: '$0',
    period: 'always',
    features: ['Real lead discovery', 'AI chat (Groq free)', 'MVP generator', 'WhatsApp links', '25 leads / search'],
    cta: 'Get started free',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$0',
    period: 'self-hosted',
    features: ['Unlimited lead discovery', 'Gmail OAuth campaigns', 'WhatsApp Cloud API', 'Unlimited AI messages', 'Full source code'],
    cta: 'Fork on GitHub',
    highlight: true,
  },
];

export default function LandingPage() {
  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text)', minHeight: '100dvh', fontFamily: "-apple-system,'SF Pro Display','Inter',sans-serif" }}>

      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 sm:px-8"
        style={{
          paddingTop: 'max(16px, env(safe-area-inset-top, 16px))',
          paddingBottom: 14,
          background: 'rgba(8,8,15,0.82)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '0.5px solid rgba(255,255,255,.07)',
        }}>
        <div className="flex items-center gap-2.5">
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(99,102,241,.35)',
          }}>
            <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
              <rect x="3" y="3" width="4.5" height="14" rx="1.2" fill="white"/>
              <rect x="3" y="3" width="14" height="4.5" rx="1.2" fill="white"/>
              <rect x="3" y="8.5" width="10" height="3.5" rx="1.2" fill="white" opacity="0.8"/>
            </svg>
          </div>
          <span className="text-[15px] font-black text-white tracking-tight">FlowAI</span>
        </div>

        <div className="hidden sm:flex items-center gap-6">
          <a href="#features" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Features</a>
          <a href="#pricing" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Pricing</a>
          <Link to="/ai" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">AI Chat</Link>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/login" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors px-3 py-2">
            Sign in
          </Link>
          <Link to="/login?register=1"
            className="text-sm font-semibold text-white rounded-xl px-4 py-2.5"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 4px 12px rgba(99,102,241,.3)' }}>
            Get started
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="flex flex-col items-center text-center px-5 pt-36 pb-24 relative overflow-hidden">
        {/* Background glow */}
        <div style={{
          position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)',
          width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(99,102,241,.12) 0%,transparent 70%)',
          pointerEvents: 'none',
        }}/>

        <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-8 text-xs font-semibold"
            style={{ background: 'rgba(99,102,241,.1)', border: '1px solid rgba(99,102,241,.2)', color: '#a5b4fc' }}>
            <Sparkles size={12}/>
            AI-powered · 100% real data · Completely free
          </div>
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight max-w-4xl animate-fade-up"
          style={{ animationDelay: '0.15s' }}>
          Find leads,{' '}
          <span style={{ background: 'linear-gradient(135deg,#6366f1,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            close deals,
          </span>
          <br/>
          <span style={{ color: '#e2e8f0' }}>build products.</span>
        </h1>

        <p className="mt-6 text-lg text-slate-400 max-w-xl leading-relaxed animate-fade-up" style={{ animationDelay: '0.22s' }}>
          FlowAI combines real lead generation, AI-powered outreach, and an MVP project generator into one mobile-first platform. Every feature uses free, real tools.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center gap-3 animate-fade-up" style={{ animationDelay: '0.28s' }}>
          <Link to="/login?register=1"
            className="flex items-center gap-2 rounded-2xl px-7 py-4 text-base font-bold text-white"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 8px 24px rgba(99,102,241,.35)' }}>
            Start for free <ArrowRight size={18}/>
          </Link>
          <a href="#features"
            className="flex items-center gap-2 rounded-2xl px-7 py-4 text-base font-semibold text-slate-300"
            style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)' }}>
            See all features
          </a>
        </div>

        {/* Stats row */}
        <div className="mt-16 grid grid-cols-4 gap-3 sm:gap-6 w-full max-w-lg animate-fade-up" style={{ animationDelay: '0.35s' }}>
          {PROOF.map(({ n, label }) => (
            <div key={label} className="rounded-2xl py-4 text-center"
              style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)' }}>
              <p className="text-xl font-black text-white">{n}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="px-5 sm:px-8 pb-24 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-[#6366f1] mb-3">Everything you need</p>
          <h2 className="text-3xl sm:text-4xl font-black text-white">Built on real tools.<br/>Zero paid APIs.</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ icon: Icon, color, title, desc }) => (
            <div key={title}
              className="rounded-2xl p-5 transition-all duration-200"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="h-11 w-11 rounded-xl flex items-center justify-center mb-4"
                style={{ background: `${color}15`, border: `1px solid ${color}22` }}>
                <Icon size={20} color={color}/>
              </div>
              <h3 className="text-base font-bold text-white mb-1.5">{title}</h3>
              <p className="text-sm text-slate-400 leading-6">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Mobile CTA ── */}
      <section className="px-5 pb-24 max-w-2xl mx-auto text-center">
        <div className="rounded-3xl p-8 sm:p-10 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg,rgba(99,102,241,.15),rgba(139,92,246,.15))', border: '1px solid rgba(99,102,241,.2)' }}>
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 24,
            background: 'radial-gradient(circle at 50% 0%,rgba(99,102,241,.15),transparent 70%)',
            pointerEvents: 'none',
          }}/>
          <div className="inline-flex h-14 w-14 rounded-2xl items-center justify-center mb-5"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 8px 24px rgba(99,102,241,.4)' }}>
            <svg viewBox="0 0 20 20" fill="none" width="28" height="28">
              <rect x="3" y="3" width="5.5" height="14" rx="1.5" fill="white"/>
              <rect x="3" y="3" width="14" height="5.5" rx="1.5" fill="white"/>
              <rect x="3" y="9" width="10.5" height="4" rx="1.5" fill="white" opacity="0.8"/>
            </svg>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">Add to your home screen.</h2>
          <p className="text-slate-400 mb-7 leading-relaxed">FlowAI is a mobile-first PWA. Add it to your iPhone home screen for a native app experience — no App Store required.</p>
          <Link to="/login?register=1"
            className="inline-flex items-center gap-2 rounded-2xl px-8 py-4 text-base font-bold text-white"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 8px 24px rgba(99,102,241,.35)' }}>
            Start free — no card needed <ArrowRight size={18}/>
          </Link>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="px-5 sm:px-8 pb-28 max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-[#6366f1] mb-3">Pricing</p>
          <h2 className="text-3xl sm:text-4xl font-black text-white">Always free.<br/>No credit card.</h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {PLANS.map(({ name, price, period, features, cta, highlight }) => (
            <div key={name}
              className="rounded-2xl p-6 relative"
              style={highlight
                ? { background: 'rgba(99,102,241,.08)', border: '1px solid rgba(99,102,241,.3)', boxShadow: '0 0 0 1px rgba(99,102,241,.15), 0 16px 48px rgba(99,102,241,.12)' }
                : { background: 'var(--surface)', border: '1px solid var(--border)' }
              }>
              {highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full px-4 py-1 text-xs font-bold text-white"
                    style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                    Open source
                  </span>
                </div>
              )}
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">{name}</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-black text-white">{price}</span>
                <span className="text-slate-400 text-sm">/ {period}</span>
              </div>
              <ul className="mt-5 space-y-2.5 mb-6">
                {features.map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-slate-300">
                    <Check size={14} className="text-emerald-400 shrink-0"/>
                    {f}
                  </li>
                ))}
              </ul>
              <Link to={highlight ? 'https://github.com/daviddan-241/Bot2' : '/login?register=1'}
                className="block text-center rounded-xl py-3 text-sm font-bold transition-all"
                style={highlight
                  ? { background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', boxShadow: '0 4px 12px rgba(99,102,241,.3)' }
                  : { background: 'rgba(255,255,255,.07)', color: 'white', border: '1px solid rgba(255,255,255,.1)' }
                }>
                {cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t text-center py-8 px-5 text-sm text-slate-600"
        style={{ borderColor: 'rgba(255,255,255,.06)', paddingBottom: 'max(32px, env(safe-area-inset-bottom, 32px))' }}>
        <div className="flex items-center justify-center gap-2 mb-3">
          <div style={{ width: 20, height: 20, borderRadius: 5, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 20 20" fill="none" width="12" height="12">
              <rect x="3" y="3" width="5" height="14" rx="1.2" fill="white"/>
              <rect x="3" y="3" width="14" height="5" rx="1.2" fill="white"/>
              <rect x="3" y="8.5" width="10" height="3.5" rx="1.2" fill="white" opacity="0.8"/>
            </svg>
          </div>
          <span className="font-bold text-slate-400">FlowAI</span>
        </div>
        <p>Free & open · Real tools only · No paid APIs required</p>
      </footer>
    </div>
  );
}
