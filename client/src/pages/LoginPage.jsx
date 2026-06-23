import { useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Bot, Check, Code2, Eye, EyeOff, Mail, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const PERKS = [
  { icon: MapPin, color: '#6366f1', text: 'Real lead discovery worldwide' },
  { icon: Bot,    color: '#8b5cf6', text: 'AI chat powered by Groq & Llama 3' },
  { icon: Code2,  color: '#06b6d4', text: 'MVP project proposal generator' },
  { icon: Mail,   color: '#10b981', text: 'Gmail OAuth email campaigns' },
];

function FlowMark({ size = 36 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.28,
      background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 6px 20px rgba(99,102,241,.4)',
      flexShrink: 0,
    }}>
      <svg viewBox="0 0 20 20" fill="none" width={size * 0.54} height={size * 0.54}>
        <rect x="3" y="3" width="5" height="14" rx="1.3" fill="white"/>
        <rect x="3" y="3" width="14" height="5" rx="1.3" fill="white"/>
        <rect x="3" y="8.8" width="10" height="3.8" rx="1.3" fill="white" opacity="0.82"/>
      </svg>
    </div>
  );
}

export default function LoginPage() {
  const { user, login, register } = useAuth();
  const [params] = useSearchParams();
  const [mode, setMode] = useState(params.get('register') ? 'register' : 'login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/app" replace />;

  async function submit(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      if (mode === 'login') await login(form.email, form.password);
      else await register(form.name, form.email, form.password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh flex" style={{ background: 'var(--bg)' }}>

      {/* ── Left branding panel (desktop only) ── */}
      <div className="hidden lg:flex flex-col justify-between w-[46%] p-10 relative overflow-hidden"
        style={{ background: '#0b0b18', borderRight: '1px solid rgba(255,255,255,.06)' }}>

        {/* Ambient glows */}
        <div style={{ position:'absolute', top:-80, left:-80, width:380, height:380, borderRadius:'50%', background:'radial-gradient(circle,rgba(99,102,241,.2) 0%,transparent 65%)', filter:'blur(40px)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:-60, right:-60, width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle,rgba(139,92,246,.15) 0%,transparent 65%)', filter:'blur(40px)', pointerEvents:'none' }}/>

        <div className="relative">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <FlowMark size={40}/>
            <div>
              <p className="text-lg font-black text-white tracking-tight">FlowAI</p>
              <p className="text-[11px] text-slate-500 font-medium">AI Lead Engine</p>
            </div>
          </div>

          <h1 className="text-4xl font-black text-white leading-[1.1] tracking-tight mb-5">
            The AI platform<br/>that generates<br/>
            <span style={{ background:'linear-gradient(135deg,#6366f1,#a78bfa)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              real results.
            </span>
          </h1>
          <p className="text-slate-400 text-sm leading-7 mb-10 max-w-xs">
            Real leads from live APIs. Real AI powered by Groq. Real email delivery via Gmail OAuth. Zero mock data.
          </p>

          <div className="space-y-3">
            {PERKS.map(({ icon: Icon, color, text }) => (
              <div key={text} className="flex items-center gap-3 text-sm text-slate-300">
                <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background:`${color}14`, border:`1px solid ${color}22` }}>
                  <Icon size={15} color={color}/>
                </div>
                {text}
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-[11px] text-slate-700">© 2025 FlowAI · Free & open source · Real tools only</p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center px-5 py-8 sm:px-10"
        style={{ paddingTop: 'max(40px, env(safe-area-inset-top, 40px))', paddingBottom: 'max(40px, env(safe-area-inset-bottom, 40px))' }}>
        <div className="w-full max-w-sm animate-fade-up">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <FlowMark size={34}/>
            <span className="text-base font-black text-white tracking-tight">FlowAI</span>
          </div>

          {/* Heading */}
          <h2 className="text-2xl font-black text-white mb-1 tracking-tight">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h2>
          <p className="text-sm text-slate-400 mb-7">
            {mode === 'login' ? 'Sign in to your workspace' : 'Start generating real leads for free'}
          </p>

          <form onSubmit={submit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="label">Full name</label>
                <input className="input" placeholder="Jane Smith" autoComplete="name"
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
            )}

            <div>
              <label className="label">Email address</label>
              <input className="input" type="email" placeholder="you@example.com" autoComplete="email"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input className="input pr-11"
                  type={showPass ? 'text' : 'password'}
                  placeholder={mode === 'register' ? 'Min 8 characters' : '••••••••'}
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required minLength={8}/>
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                  {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl px-4 py-3 text-sm text-red-400"
                style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.18)' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="btn-primary w-full text-sm"
              style={{ height: 48 }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".3"/>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                  Please wait…
                </span>
              ) : (
                <>
                  {mode === 'login' ? 'Sign in' : 'Create account'}
                  <ArrowRight size={16}/>
                </>
              )}
            </button>
          </form>

          {mode === 'register' && (
            <div className="mt-4 space-y-2">
              {['Free forever — no credit card', 'Real leads from live APIs', '100% open source'].map(f => (
                <div key={f} className="flex items-center gap-2 text-xs text-slate-500">
                  <Check size={12} className="text-emerald-500 shrink-0"/>{f}
                </div>
              ))}
            </div>
          )}

          <p className="mt-6 text-center text-sm text-slate-500">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
              className="font-semibold hover:text-white transition-colors" style={{ color: '#a5b4fc' }}>
              {mode === 'login' ? 'Sign up free' : 'Sign in'}
            </button>
          </p>

          <Link to="/" className="mt-5 block text-center text-xs text-slate-600 hover:text-slate-400 transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
