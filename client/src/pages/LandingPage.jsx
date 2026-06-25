import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bot, Check, ChevronRight, Mail, MessageCircle, Search, Send, Sparkles, TrendingUp, Users, Zap } from 'lucide-react';
import Logo from '../components/Logo.jsx';

const DEMO_MESSAGES = [
  { role: 'assistant', content: "Hi! I'm FlowAI — tell me who you want to reach and I'll find real leads, score them, and send outreach automatically. Try me 👇" },
];

const SUGGESTIONS = [
  'Find 10 restaurants in Dubai needing a website',
  'Find dentists in London to email',
  'Find 15 gyms in New York urgently',
  'Find startups in Lagos needing design',
];

const FEATURES = [
  { icon: Search,        color: '#2563EB', title: 'Real lead discovery',    desc: 'Pulls actual businesses with emails, phones, and websites from Google, Serper, and Brave.' },
  { icon: Bot,           color: '#7C3AED', title: 'AI chat interface',       desc: 'One message starts the whole pipeline — find leads, score, create campaigns, send emails.' },
  { icon: TrendingUp,    color: '#DC2626', title: 'Auto lead scoring',       desc: 'Every lead scored Hot / Warm / Cold by AI in real-time. Focus only on who is ready to buy.' },
  { icon: Mail,          color: '#16A34A', title: 'Gmail campaigns',         desc: 'Connect Gmail in one click. Sends personalized emails to all your hot leads at scale.' },
  { icon: MessageCircle, color: '#D97706', title: 'WhatsApp outreach',       desc: 'Meta Cloud API for real sends, or wa.me links — reach leads on WhatsApp instantly.' },
  { icon: Users,         color: '#0891B2', title: 'CRM pipeline board',      desc: 'Full Kanban board, lead detail pages, campaign stats — all your outreach in one place.' },
];

function TypingDots() {
  return (
    <div className="flex gap-1.5 items-center h-5 px-1">
      {[0, 1, 2].map(i => (
        <div key={i} className="h-2 w-2 rounded-full"
          style={{ background: 'var(--brand)', animation: `pulseDot 1.4s ease-in-out ${i * 0.2}s infinite` }} />
      ))}
    </div>
  );
}

function ChatBubble({ role, content, isNew }) {
  const isUser = role === 'user';
  return (
    <div className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'} ${isNew ? 'animate-fade-up' : ''}`}>
      {!isUser && (
        <div className="h-7 w-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: 'var(--brand)' }}>
          <Bot size={13} color="white" />
        </div>
      )}
      <div className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${isUser ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
        style={isUser
          ? { background: 'var(--brand)', color: 'white' }
          : { background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }
        }>
        <p className="whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [messages, setMessages] = useState(DEMO_MESSAGES);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [tried, setTried] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function send(text) {
    const content = (text || input).trim();
    if (!content || loading) return;
    setInput('');
    const next = [...messages, { role: 'user', content, isNew: true }];
    setMessages(next);
    setLoading(true);
    setTried(true);
    try {
      const res = await fetch('/anon/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: next
            .filter(m => m.role !== 'system')
            .map(({ role, content }) => ({ role, content })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setMessages([...next, { role: 'assistant', content: data.message, isNew: true }]);
    } catch (err) {
      setMessages([...next, { role: 'assistant', content: `Sign up to use the full AI pipeline — it's completely free. ${err.message || ''}`, isNew: true }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  const onKey = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div style={{ background: '#FFFFFF', color: 'var(--text)', minHeight: '100dvh', fontFamily: "'Inter', -apple-system, sans-serif", maxWidth: '100vw', overflowX: 'hidden' }}>

      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-8"
        style={{
          paddingTop: 'max(14px, env(safe-area-inset-top, 14px))',
          paddingBottom: 12,
          background: 'rgba(255,255,255,0.94)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border)',
        }}>
        <Logo size={28} textSize="text-[15px]" />
        <div className="flex items-center gap-2">
          <Link to="/login"
            className="text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            style={{ color: 'var(--text-2)' }}>
            Sign in
          </Link>
          <Link to="/login?register=1"
            className="text-sm font-bold text-white rounded-xl px-4 py-2.5 flex items-center gap-1.5"
            style={{ background: 'var(--brand)', boxShadow: '0 1px 2px rgba(37,99,235,.3)' }}>
            Get started <ArrowRight size={13} />
          </Link>
        </div>
      </nav>

      {/* ── Hero — live chat ── */}
      <section className="px-4 pt-28 pb-8 flex flex-col items-center"
        style={{ background: 'linear-gradient(180deg,#F0F6FF 0%,#FFFFFF 100%)' }}>

        <div className="mb-5 animate-fade-in">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold"
            style={{ background: 'var(--brand-light)', color: 'var(--brand)', border: '1px solid rgba(37,99,235,.15)' }}>
            <Sparkles size={11} /> Free forever · Real data · No credit card
          </div>
        </div>

        <h1 className="text-[2.15rem] sm:text-5xl font-black leading-tight tracking-tight text-center mb-4 animate-fade-up"
          style={{ animationDelay: '0.05s', color: 'var(--text)', letterSpacing: '-0.03em', maxWidth: 480 }}>
          Find leads &amp; send outreach.{' '}
          <span style={{ color: 'var(--brand)' }}>Automatically.</span>
        </h1>

        <p className="text-base text-center mb-8 animate-fade-up max-w-sm leading-relaxed"
          style={{ animationDelay: '0.1s', color: 'var(--text-2)' }}>
          Type what you need — FlowAI finds real businesses, scores them with AI, and sends personalised emails in one go.
        </p>

        {/* ── Live Chat Box ── */}
        <div className="w-full max-w-lg animate-fade-up" style={{ animationDelay: '0.15s' }}>
          <div className="rounded-3xl overflow-hidden"
            style={{ border: '1px solid var(--border)', boxShadow: '0 8px 40px rgba(37,99,235,.1)', background: 'var(--bg)' }}>

            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-3"
              style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
              <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'var(--brand)' }}>
                <Bot size={15} color="white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold leading-none" style={{ color: 'var(--text)' }}>FlowAI</p>
                <p className="text-[11px] mt-0.5" style={{ color: '#16A34A' }}>● Live · Powered by Groq</p>
              </div>
              <Link to="/login?register=1"
                className="text-xs font-bold px-3 py-1.5 rounded-xl"
                style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}>
                Sign up free
              </Link>
            </div>

            {/* Messages */}
            <div className="p-4 space-y-3 overflow-y-auto" style={{ minHeight: 160, maxHeight: 300 }}>
              {messages.map((m, i) => (
                <ChatBubble key={i} {...m} isNew={m.isNew && i === messages.length - 1} />
              ))}
              {loading && (
                <div className="flex gap-2 justify-start animate-fade-up">
                  <div className="h-7 w-7 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'var(--brand)' }}>
                    <Bot size={13} color="white" />
                  </div>
                  <div className="rounded-2xl rounded-bl-sm px-4 py-2.5"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                    <TypingDots />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Suggestions */}
            {!tried && (
              <div className="px-4 pb-2">
                <p className="text-[10px] font-semibold mb-1.5 px-1" style={{ color: 'var(--text-3)' }}>Try asking:</p>
                <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                  {SUGGESTIONS.map(s => (
                    <button key={s} onClick={() => send(s)}
                      className="shrink-0 text-[11px] rounded-xl px-3 py-1.5 font-medium whitespace-nowrap"
                      style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-2)' }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="px-3 pb-3">
              <div className="flex gap-2 rounded-2xl p-2"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <textarea
                  ref={inputRef}
                  rows={1}
                  className="flex-1 resize-none bg-transparent text-sm outline-none px-2 py-1.5 leading-relaxed"
                  style={{ maxHeight: 80, color: 'var(--text)' }}
                  placeholder="Find 10 restaurants in Dubai urgently needing a website…"
                  value={input}
                  onChange={e => {
                    setInput(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px';
                  }}
                  onKeyDown={onKey}
                />
                <button
                  disabled={loading || !input.trim()}
                  onClick={() => send()}
                  className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 self-end transition-all disabled:opacity-30"
                  style={{ background: 'var(--brand)' }}>
                  <Send size={15} color="white" />
                </button>
              </div>
            </div>
          </div>

          {tried && (
            <div className="mt-4 animate-fade-up text-center">
              <Link to="/login?register=1"
                className="inline-flex items-center gap-2 rounded-2xl px-7 py-4 text-base font-bold text-white"
                style={{ background: 'var(--brand)', boxShadow: '0 4px 20px rgba(37,99,235,.3)' }}>
                Run the full pipeline free <ArrowRight size={17} />
              </Link>
              <p className="text-xs mt-2" style={{ color: 'var(--text-3)' }}>No credit card · Takes 30 seconds</p>
            </div>
          )}
        </div>

        {/* Stats row */}
        <div className="mt-10 grid grid-cols-4 gap-2 w-full max-w-lg animate-fade-up" style={{ animationDelay: '0.25s' }}>
          {[{ n: '100%', l: 'Real data' }, { n: 'Free', l: 'Always' }, { n: 'AI', l: 'Powered' }, { n: '0', l: 'Mock data' }].map(({ n, l }) => (
            <div key={l} className="rounded-2xl py-3 text-center"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <p className="text-lg font-black" style={{ color: 'var(--text)' }}>{n}</p>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-3)' }}>{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="px-4 py-16 max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-[11px] font-bold uppercase tracking-[.2em] mb-2" style={{ color: 'var(--brand)' }}>How it works</p>
          <h2 className="text-2xl sm:text-3xl font-black" style={{ color: 'var(--text)', letterSpacing: '-0.03em' }}>
            One message. Full pipeline.
          </h2>
        </div>
        <div className="space-y-4">
          {[
            { n: '01', title: 'Tell the AI what you need', desc: 'Type: "Find 20 restaurants in Dubai that need a website." One sentence is all it takes.' },
            { n: '02', title: 'AI finds and scores leads', desc: 'Real APIs pull actual businesses. AI scores each one Hot, Warm, or Cold instantly.' },
            { n: '03', title: 'Campaigns run automatically', desc: 'FlowAI writes personalised emails and sends them to every hot lead — zero manual work.' },
          ].map(({ n, title, desc }) => (
            <div key={n} className="flex gap-4 rounded-2xl p-5"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-black"
                style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}>
                {n}
              </div>
              <div>
                <p className="text-sm font-bold mb-1" style={{ color: 'var(--text)' }}>{title}</p>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="px-4 py-16 max-w-2xl mx-auto" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="text-center mb-10">
          <p className="text-[11px] font-bold uppercase tracking-[.2em] mb-2" style={{ color: 'var(--brand)' }}>Everything you need</p>
          <h2 className="text-2xl sm:text-3xl font-black" style={{ color: 'var(--text)', letterSpacing: '-0.03em' }}>
            Real tools. Zero paid APIs.
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FEATURES.map(({ icon: Icon, color, title, desc }) => (
            <div key={title} className="rounded-2xl p-4"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="h-9 w-9 rounded-xl flex items-center justify-center mb-3"
                style={{ background: `${color}12` }}>
                <Icon size={17} color={color} />
              </div>
              <p className="text-sm font-bold mb-1" style={{ color: 'var(--text)' }}>{title}</p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── iOS PWA CTA ── */}
      <section className="px-4 py-12 max-w-lg mx-auto">
        <div className="rounded-3xl p-7 text-center"
          style={{ background: 'linear-gradient(135deg,#EFF6FF,#F0F7FF)', border: '1px solid rgba(37,99,235,.15)' }}>
          <div className="inline-flex h-12 w-12 rounded-2xl items-center justify-center mb-4"
            style={{ background: 'var(--brand)', boxShadow: '0 6px 20px rgba(37,99,235,.3)' }}>
            <Logo size={24} showText={false} white />
          </div>
          <h2 className="text-xl font-black mb-2" style={{ color: 'var(--text)', letterSpacing: '-0.02em' }}>
            Add to your Home Screen.
          </h2>
          <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--text-2)' }}>
            FlowAI is a mobile-first PWA built for iOS. Add it to your iPhone home screen for a full native app experience — no App Store needed.
          </p>
          <Link to="/login?register=1"
            className="inline-flex items-center gap-2 rounded-2xl px-7 py-3.5 text-sm font-bold text-white"
            style={{ background: 'var(--brand)', boxShadow: '0 4px 16px rgba(37,99,235,.3)' }}>
            Start free — no card needed <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="px-4 py-16 max-w-lg mx-auto" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="text-center mb-10">
          <p className="text-[11px] font-bold uppercase tracking-[.2em] mb-2" style={{ color: 'var(--brand)' }}>Pricing</p>
          <h2 className="text-2xl sm:text-3xl font-black" style={{ color: 'var(--text)', letterSpacing: '-0.03em' }}>
            Always free. No credit card.
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            {
              name: 'Free forever', price: '$0', period: 'always',
              features: ['Real lead discovery', 'AI chat (Groq)', 'MVP generator', 'WhatsApp links', '25 leads / search'],
              cta: 'Get started free', href: '/login?register=1', highlight: false,
            },
            {
              name: 'Pro (Self-hosted)', price: '$0', period: 'self-hosted',
              features: ['Unlimited lead discovery', 'Gmail OAuth campaigns', 'WhatsApp Cloud API', 'Unlimited AI', 'Auto pipeline'],
              cta: 'Fork on GitHub', href: 'https://github.com/daviddan-241/Bot2', highlight: true,
            },
          ].map(({ name, price, period, features, cta, href, highlight }) => (
            <div key={name} className="rounded-2xl p-5 relative"
              style={highlight
                ? { background: 'var(--brand)', boxShadow: '0 8px 30px rgba(37,99,235,.3)', border: '1px solid var(--brand)' }
                : { background: 'var(--surface)', border: '1px solid var(--border)' }
              }>
              {highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full px-4 py-1 text-xs font-bold bg-white" style={{ color: 'var(--brand)' }}>Most popular</span>
                </div>
              )}
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: highlight ? 'rgba(255,255,255,.7)' : 'var(--text-3)' }}>{name}</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-3xl font-black" style={{ color: highlight ? 'white' : 'var(--text)' }}>{price}</span>
                <span className="text-sm" style={{ color: highlight ? 'rgba(255,255,255,.6)' : 'var(--text-3)' }}>/ {period}</span>
              </div>
              <ul className="mt-4 space-y-2 mb-5">
                {features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm"
                    style={{ color: highlight ? 'rgba(255,255,255,.85)' : 'var(--text-2)' }}>
                    <Check size={13} color={highlight ? 'rgba(255,255,255,.9)' : '#16A34A'} />
                    {f}
                  </li>
                ))}
              </ul>
              <a href={href}
                className="block text-center rounded-xl py-2.5 text-sm font-bold transition-all"
                style={highlight
                  ? { background: 'rgba(255,255,255,.15)', color: 'white', border: '1px solid rgba(255,255,255,.25)' }
                  : { background: 'var(--brand)', color: 'white' }
                }>
                {cta}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t text-center py-8 px-4 text-xs"
        style={{ borderColor: 'var(--border)', color: 'var(--text-3)', paddingBottom: 'max(32px, env(safe-area-inset-bottom, 32px))' }}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <Logo size={18} textSize="text-sm" />
        </div>
        <p>Free &amp; open · Real tools only · No paid APIs required</p>
        <a href="https://github.com/daviddan-241/Bot2" className="mt-1 inline-block font-semibold hover:underline" style={{ color: 'var(--brand)' }}>
          View on GitHub →
        </a>
      </footer>
    </div>
  );
}
