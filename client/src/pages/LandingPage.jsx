import { Link } from 'react-router-dom';
import { ArrowRight, Bot, Check, Code2, Mail, MessageCircle, Search, Sparkles, TrendingUp, Users, Zap } from 'lucide-react';
import Logo from '../components/Logo.jsx';

const FEATURES = [
  {
    icon: Search, color: '#2563EB',
    title: 'Real lead discovery',
    desc: 'Finds actual businesses with real contact data — names, emails, websites, and phone numbers — from Google, Serper, Brave, and more.',
  },
  {
    icon: Bot, color: '#7C3AED',
    title: 'AI-powered by Groq',
    desc: 'Type a command like "Find urgent leads in Lagos" and the AI finds leads, scores them, and creates campaigns automatically.',
  },
  {
    icon: Code2, color: '#0891B2',
    title: 'MVP web generator',
    desc: 'Describe any project and get a full HTML/CSS proposal, feature list, timeline, and pricing — ready to send to a client.',
  },
  {
    icon: Mail, color: '#16A34A',
    title: 'Real Gmail campaigns',
    desc: 'Connect your Gmail or Outlook in one click (OAuth). Send personalized emails to all your leads at scale.',
  },
  {
    icon: MessageCircle, color: '#D97706',
    title: 'WhatsApp outreach',
    desc: 'Meta Cloud API for real sends, or wa.me click-to-chat links. Reach leads on WhatsApp directly from your dashboard.',
  },
  {
    icon: TrendingUp, color: '#DC2626',
    title: 'Auto lead scoring',
    desc: 'Every lead is instantly scored Hot / Warm / Cold using AI + a rule engine. Focus only on leads ready to buy.',
  },
];

const STATS = [
  { n: '100%', label: 'Real data' },
  { n: 'Free', label: 'All tools' },
  { n: 'AI', label: 'Powered' },
  { n: '0', label: 'Mock data' },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Tell the AI what you need',
    desc: 'Type: "Find 20 restaurants in Dubai that urgently need a website." The AI understands your intent.',
  },
  {
    step: '02',
    title: 'AI finds and scores leads',
    desc: 'Real search APIs pull actual businesses. The AI scores each one for buying urgency — Hot, Warm, or Cold.',
  },
  {
    step: '03',
    title: 'Campaigns run automatically',
    desc: 'FlowAI creates a personalized outreach campaign and sends emails or WhatsApp messages to every hot lead.',
  },
];

export default function LandingPage() {
  return (
    <div style={{ background: '#FFFFFF', color: 'var(--text)', minHeight: '100dvh', fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 sm:px-8"
        style={{
          paddingTop: 'max(16px, env(safe-area-inset-top, 16px))',
          paddingBottom: 14,
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border)',
        }}>
        <Logo size={30} textSize="text-[15px]"/>

        <div className="hidden sm:flex items-center gap-7">
          <a href="#features" className="text-sm font-medium hover:text-[var(--brand)] transition-colors" style={{ color: 'var(--text-2)' }}>Features</a>
          <a href="#how" className="text-sm font-medium hover:text-[var(--brand)] transition-colors" style={{ color: 'var(--text-2)' }}>How it works</a>
          <a href="#pricing" className="text-sm font-medium hover:text-[var(--brand)] transition-colors" style={{ color: 'var(--text-2)' }}>Pricing</a>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/login" className="text-sm font-semibold px-4 py-2 rounded-xl transition-colors hover:bg-[var(--surface-2)]" style={{ color: 'var(--text-2)' }}>
            Sign in
          </Link>
          <Link to="/login?register=1"
            className="text-sm font-semibold text-white rounded-xl px-4 py-2.5 flex items-center gap-1.5"
            style={{ background: 'var(--brand)', boxShadow: '0 1px 2px rgba(37,99,235,.3)' }}>
            Get started <ArrowRight size={14}/>
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="flex flex-col items-center text-center px-5 pt-36 pb-20 relative overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #F8FAFF 0%, #FFFFFF 100%)' }}>
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: 800, height: 400,
          background: 'radial-gradient(ellipse at top, rgba(37,99,235,.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}/>

        <div className="animate-fade-in mb-6">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold"
            style={{ background: 'var(--brand-light)', color: 'var(--brand)', border: '1px solid rgba(37,99,235,.15)' }}>
            <Sparkles size={12}/> AI-powered · 100% real data · Completely free
          </div>
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight max-w-4xl animate-fade-up"
          style={{ animationDelay: '0.1s', color: 'var(--text)', letterSpacing: '-0.03em' }}>
          Automatically find leads
          <br/>
          <span style={{ color: 'var(--brand)' }}>and send emails.</span>
          <br/>
          <span style={{ color: 'var(--text-2)', fontSize: '0.85em', fontWeight: 800 }}>Zero guesswork.</span>
        </h1>

        <p className="mt-6 text-lg max-w-xl leading-relaxed animate-fade-up" style={{ animationDelay: '0.18s', color: 'var(--text-2)' }}>
          FlowAI's AI chat finds businesses that <strong style={{ color: 'var(--text)' }}>urgently need your services</strong>, scores them in real-time, and sends personalized outreach — all automatically.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center gap-3 animate-fade-up" style={{ animationDelay: '0.24s' }}>
          <Link to="/login?register=1"
            className="flex items-center gap-2 rounded-2xl px-7 py-4 text-base font-bold text-white"
            style={{ background: 'var(--brand)', boxShadow: '0 4px 20px rgba(37,99,235,.3)' }}>
            Start for free <ArrowRight size={18}/>
          </Link>
          <a href="#how"
            className="flex items-center gap-2 rounded-2xl px-7 py-4 text-base font-semibold"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-2)', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
            How it works
          </a>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-4 gap-3 w-full max-w-lg animate-fade-up" style={{ animationDelay: '0.3s' }}>
          {STATS.map(({ n, label }) => (
            <div key={label} className="rounded-2xl py-4 text-center"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
              <p className="text-xl font-black" style={{ color: 'var(--text)' }}>{n}</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-3)' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* App preview mockup */}
        <div className="mt-16 w-full max-w-4xl rounded-2xl overflow-hidden animate-fade-up"
          style={{ animationDelay: '0.38s', border: '1px solid var(--border)', boxShadow: '0 20px 60px rgba(0,0,0,.08)', background: 'var(--bg)' }}>
          <div className="flex items-center gap-2 px-4 py-3" style={{ background: '#F1F5F9', borderBottom: '1px solid var(--border)' }}>
            <div className="h-3 w-3 rounded-full bg-red-400"/>
            <div className="h-3 w-3 rounded-full bg-yellow-400"/>
            <div className="h-3 w-3 rounded-full bg-green-400"/>
            <div className="flex-1 mx-4 rounded-lg h-6 flex items-center justify-center text-xs" style={{ background: 'var(--surface)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
              app.flowai.io
            </div>
          </div>
          <div className="p-6">
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-2)' }}>Welcome back,</p>
            <p className="text-xs mb-5" style={{ color: 'var(--text-3)' }}>Here's your outreach performance</p>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[{ l: 'EMAILS SENT', v: '5,029', t: '+36.3%' }, { l: 'OPENED', v: '3,987', t: '' }, { l: 'REPLIED', v: '3,260', t: '' }].map(({ l, v, t }) => (
                <div key={l} className="rounded-xl p-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <p className="text-[9px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-3)' }}>{l}</p>
                  <p className="text-xl font-black" style={{ color: 'var(--text)' }}>{v}</p>
                  {t && <p className="text-[10px] font-semibold mt-0.5" style={{ color: 'var(--success)' }}>{t}</p>}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[{ l: 'ACTIVE CAMPAIGNS', v: '89' }, { l: 'LEADS FOUND', v: '6,346' }, { l: 'CREDITS AVAILABLE', v: '2,443' }].map(({ l, v }) => (
                <div key={l} className="rounded-xl p-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <p className="text-[9px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-3)' }}>{l}</p>
                  <p className="text-xl font-black" style={{ color: 'var(--text)' }}>{v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="px-5 sm:px-8 py-20 max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-bold uppercase tracking-[.2em] mb-3" style={{ color: 'var(--brand)' }}>How it works</p>
          <h2 className="text-3xl sm:text-4xl font-black" style={{ color: 'var(--text)', letterSpacing: '-0.03em' }}>
            Just tell the AI what you want.
          </h2>
          <p className="mt-3 text-lg max-w-lg mx-auto" style={{ color: 'var(--text-2)' }}>
            No configuration, no manual searching. One message starts the whole pipeline.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {HOW_IT_WORKS.map(({ step, title, desc }) => (
            <div key={step} className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
              <div className="h-10 w-10 rounded-2xl flex items-center justify-center mb-4 text-sm font-black"
                style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}>
                {step}
              </div>
              <h3 className="text-base font-bold mb-2" style={{ color: 'var(--text)' }}>{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>{desc}</p>
            </div>
          ))}
        </div>

        {/* AI chat preview */}
        <div className="mt-10 rounded-2xl p-5 sm:p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
          <div className="flex items-center gap-3 mb-4 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--brand)' }}>
              <Bot size={15} color="white"/>
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>FlowAI Chat</p>
              <p className="text-xs" style={{ color: 'var(--success)' }}>● Live · Powered by Groq</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-end">
              <div className="rounded-2xl rounded-br-sm px-4 py-2.5 text-sm max-w-xs"
                style={{ background: 'var(--brand)', color: 'white' }}>
                Find 10 restaurants in Lagos that urgently need a website and create an outreach campaign
              </div>
            </div>
            <div className="flex gap-2.5 max-w-md">
              <div className="h-7 w-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'var(--brand)' }}>
                <Bot size={13} color="white"/>
              </div>
              <div className="rounded-2xl rounded-bl-sm px-4 py-3 text-sm" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-2)', lineHeight: 1.6 }}>
                <strong style={{ color: 'var(--text)' }}>Found 10 restaurants in Lagos. 🔥 4 Hot leads, 3 Warm, 3 Cold.</strong>
                <br/>I've created campaign "Lagos Restaurant Outreach" and queued 4 emails to your hottest leads. Connect Gmail to send now.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="px-5 sm:px-8 py-20 max-w-5xl mx-auto"
        style={{ borderTop: '1px solid var(--border)' }}>
        <div className="text-center mb-14">
          <p className="text-xs font-bold uppercase tracking-[.2em] mb-3" style={{ color: 'var(--brand)' }}>Everything you need</p>
          <h2 className="text-3xl sm:text-4xl font-black" style={{ color: 'var(--text)', letterSpacing: '-0.03em' }}>
            Built on real tools.<br/>Zero paid APIs required.
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ icon: Icon, color, title, desc }) => (
            <div key={title} className="rounded-2xl p-5 transition-all hover:shadow-lifted"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
              <div className="h-10 w-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: `${color}12` }}>
                <Icon size={19} color={color}/>
              </div>
              <h3 className="text-base font-bold mb-1.5" style={{ color: 'var(--text)' }}>{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Add to Home Screen CTA ── */}
      <section className="px-5 py-16 max-w-2xl mx-auto">
        <div className="rounded-3xl p-8 sm:p-10 text-center relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #F0F7FF 100%)', border: '1px solid rgba(37,99,235,.15)' }}>
          <div className="inline-flex h-14 w-14 rounded-2xl items-center justify-center mb-5"
            style={{ background: 'var(--brand)', boxShadow: '0 8px 24px rgba(37,99,235,.3)' }}>
            <Logo size={28} showText={false} white/>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black mb-3" style={{ color: 'var(--text)', letterSpacing: '-0.03em' }}>Add to your Home Screen.</h2>
          <p className="mb-7 leading-relaxed" style={{ color: 'var(--text-2)' }}>
            FlowAI is a mobile-first PWA. Add it to your iPhone home screen for a full native app experience — no App Store needed.
          </p>
          <Link to="/login?register=1"
            className="inline-flex items-center gap-2 rounded-2xl px-8 py-4 text-base font-bold text-white"
            style={{ background: 'var(--brand)', boxShadow: '0 4px 20px rgba(37,99,235,.3)' }}>
            Start free — no card needed <ArrowRight size={18}/>
          </Link>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="px-5 sm:px-8 py-20 max-w-3xl mx-auto"
        style={{ borderTop: '1px solid var(--border)' }}>
        <div className="text-center mb-14">
          <p className="text-xs font-bold uppercase tracking-[.2em] mb-3" style={{ color: 'var(--brand)' }}>Pricing</p>
          <h2 className="text-3xl sm:text-4xl font-black" style={{ color: 'var(--text)', letterSpacing: '-0.03em' }}>
            Always free.<br/>No credit card.
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          {[
            {
              name: 'Free forever',
              price: '$0',
              period: 'always',
              features: ['Real lead discovery', 'AI chat (Groq free)', 'MVP generator', 'WhatsApp links', '25 leads / search'],
              cta: 'Get started free',
              href: '/login?register=1',
              highlight: false,
            },
            {
              name: 'Pro (Self-hosted)',
              price: '$0',
              period: 'self-hosted',
              features: ['Unlimited lead discovery', 'Gmail OAuth campaigns', 'WhatsApp Cloud API', 'Unlimited AI messages', 'Auto pipeline'],
              cta: 'Fork on GitHub',
              href: '#',
              highlight: true,
            },
          ].map(({ name, price, period, features, cta, href, highlight }) => (
            <div key={name} className="rounded-2xl p-6 relative"
              style={highlight
                ? { background: 'var(--brand)', boxShadow: '0 8px 30px rgba(37,99,235,.3)', border: '1px solid var(--brand)' }
                : { background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,.05)' }
              }>
              {highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full px-4 py-1 text-xs font-bold bg-white" style={{ color: 'var(--brand)' }}>
                    Most popular
                  </span>
                </div>
              )}
              <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: highlight ? 'rgba(255,255,255,.7)' : 'var(--text-3)' }}>{name}</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-black" style={{ color: highlight ? 'white' : 'var(--text)' }}>{price}</span>
                <span className="text-sm" style={{ color: highlight ? 'rgba(255,255,255,.6)' : 'var(--text-3)' }}>/ {period}</span>
              </div>
              <ul className="mt-5 space-y-2.5 mb-6">
                {features.map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm"
                    style={{ color: highlight ? 'rgba(255,255,255,.85)' : 'var(--text-2)' }}>
                    <Check size={14} className="shrink-0" color={highlight ? 'rgba(255,255,255,.9)' : '#16A34A'}/>
                    {f}
                  </li>
                ))}
              </ul>
              <Link to={href}
                className="block text-center rounded-xl py-3 text-sm font-bold transition-all"
                style={highlight
                  ? { background: 'rgba(255,255,255,.15)', color: 'white', border: '1px solid rgba(255,255,255,.25)' }
                  : { background: 'var(--brand)', color: 'white', boxShadow: '0 1px 2px rgba(37,99,235,.3)' }
                }>
                {cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t text-center py-8 px-5 text-sm"
        style={{ borderColor: 'var(--border)', color: 'var(--text-3)', paddingBottom: 'max(32px, env(safe-area-inset-bottom, 32px))' }}>
        <div className="flex items-center justify-center gap-2 mb-3">
          <Logo size={20} textSize="text-sm"/>
        </div>
        <p>Free & open · Real tools only · No paid APIs required</p>
      </footer>
    </div>
  );
}
