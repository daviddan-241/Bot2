import { useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Bot, Check, Code2, Eye, EyeOff, Mail, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import Logo from '../components/Logo.jsx';

const PERKS = [
  { icon: MapPin, color: '#2563EB', text: 'Real lead discovery worldwide' },
  { icon: Bot,    color: '#7C3AED', text: 'AI chat powered by Groq (free)' },
  { icon: Code2,  color: '#0891B2', text: 'MVP web project generator' },
  { icon: Mail,   color: '#16A34A', text: 'Gmail OAuth email campaigns' },
];

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
        style={{ background: 'var(--brand)', borderRight: '1px solid rgba(255,255,255,.15)' }}>

        <div className="relative z-10">
          <div className="mb-10">
            <Logo size={36} showText={true} white textSize="text-lg"/>
          </div>

          <h1 className="text-4xl font-black text-white leading-[1.1] tracking-tight mb-4"
            style={{ letterSpacing: '-0.03em' }}>
            The AI that finds leads<br/>and sends emails.<br/>
            <span style={{ opacity: 0.75 }}>Automatically.</span>
          </h1>
          <p className="text-blue-100 text-sm leading-7 mb-10 max-w-xs">
            Real businesses. Real AI. Real emails. Zero mock data, zero guesswork.
          </p>

          <div className="space-y-3">
            {PERKS.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-sm text-blue-100">
                <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(255,255,255,.15)' }}>
                  <Icon size={15} color="white"/>
                </div>
                {text}
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-blue-200 text-[11px]">© 2025 FlowAI · Free & open source · Real tools only</p>

        {/* Decorative circles */}
        <div style={{ position:'absolute', bottom:-100, right:-100, width:300, height:300, borderRadius:'50%', background:'rgba(255,255,255,.06)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', top:-60, right:-40, width:200, height:200, borderRadius:'50%', background:'rgba(255,255,255,.04)', pointerEvents:'none' }}/>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center px-5 py-8 sm:px-10"
        style={{
          paddingTop: 'max(40px, env(safe-area-inset-top, 40px))',
          paddingBottom: 'max(40px, env(safe-area-inset-bottom, 40px))',
          background: '#FFFFFF',
        }}>
        <div className="w-full max-w-sm animate-fade-up">

          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <Logo size={32} textSize="text-[15px]"/>
          </div>

          <h2 className="text-2xl font-black mb-1" style={{ color: 'var(--text)', letterSpacing: '-0.03em' }}>
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h2>
          <p className="text-sm mb-7" style={{ color: 'var(--text-2)' }}>
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--text-3)' }}>
                  {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl px-4 py-3 text-sm text-red-700"
                style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full" style={{ height: 48 }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".3"/>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                  Please wait…
                </span>
              ) : (
                <>{mode === 'login' ? 'Sign in' : 'Create account'} <ArrowRight size={16}/></>
              )}
            </button>
          </form>

          {mode === 'register' && (
            <div className="mt-4 space-y-2">
              {['Free forever — no credit card', 'Real leads from live APIs', 'Auto email campaigns'].map(f => (
                <div key={f} className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-3)' }}>
                  <Check size={12} color="#16A34A" className="shrink-0"/> {f}
                </div>
              ))}
            </div>
          )}

          <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-3)' }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
              className="font-semibold transition-colors" style={{ color: 'var(--brand)' }}>
              {mode === 'login' ? 'Sign up free' : 'Sign in'}
            </button>
          </p>

          <Link to="/" className="mt-5 block text-center text-xs transition-colors hover:opacity-70" style={{ color: 'var(--text-3)' }}>
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
