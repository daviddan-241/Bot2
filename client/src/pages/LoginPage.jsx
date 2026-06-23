import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowRight, Bot, Code2, Mail, MapPin, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const PERKS = [
  { icon: MapPin, text: 'Real lead discovery worldwide' },
  { icon: Bot,   text: 'AI chat powered by Groq & Llama 3' },
  { icon: Code2, text: 'MVP project proposal generator' },
  { icon: Mail,  text: 'Gmail OAuth email campaigns' },
];

export default function LoginPage() {
  const { user, login, register } = useAuth();
  const [mode, setMode] = useState('login');
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
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen min-h-dvh flex" style={{ background: '#0A0A14' }}>

      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-[44%] p-10 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #0d0d1f 0%, #12102a 100%)', borderRight: '1px solid rgba(255,255,255,.06)' }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 rounded-full opacity-30"
            style={{ background: 'radial-gradient(circle, #5c67ff 0%, transparent 70%)', filter: 'blur(80px)' }}/>
          <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)', filter: 'blur(60px)' }}/>
        </div>

        <div className="relative">
          <div className="flex items-center gap-3 mb-14">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#5c67ff,#7c3aed)', boxShadow: '0 4px 20px rgba(92,103,255,.4)' }}>
              <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                <path d="M12 3 L20 18 L12 14 L4 18 Z" fill="white" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <p className="text-base font-bold text-white">FlowAI</p>
              <p className="text-[10px] text-slate-500">AI Lead Engine</p>
            </div>
          </div>

          <h1 className="text-4xl font-black text-white leading-tight mb-4">
            The AI platform<br/>that generates<br/>
            <span style={{ background: 'linear-gradient(135deg,#5c67ff,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              real results.
            </span>
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-10">
            Real leads from live APIs. Real AI powered by Groq. Real email delivery via Gmail OAuth. Zero mock data.
          </p>

          <div className="space-y-3">
            {PERKS.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-sm text-slate-300">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(92,103,255,.15)', border: '1px solid rgba(92,103,255,.2)' }}>
                  <Icon size={15} color="#a5b0ff"/>
                </div>
                {text}
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-[11px] text-slate-600">© 2025 FlowAI · Free & open · Real tools only</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-5 sm:p-8">
        <div className="w-full max-w-sm animate-fade-up">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#5c67ff,#7c3aed)' }}>
              <svg viewBox="0 0 24 24" fill="none" width="17" height="17">
                <path d="M12 3 L20 18 L12 14 L4 18 Z" fill="white"/>
              </svg>
            </div>
            <span className="text-sm font-bold text-white">FlowAI</span>
          </div>

          <h2 className="text-2xl font-black text-white mb-1">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h2>
          <p className="text-sm text-slate-400 mb-8">
            {mode === 'login' ? 'Sign in to your workspace' : 'Start generating leads for free'}
          </p>

          <form onSubmit={submit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="label">Full name</label>
                <input className="input" placeholder="Jane Smith" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
            )}

            <div>
              <label className="label">Email address</label>
              <input className="input" type="email" placeholder="you@example.com" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input className="input pr-11" type={showPass ? 'text' : 'password'}
                  placeholder={mode === 'register' ? 'Min 8 characters' : '••••••••'}
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  required minLength={8} />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                  {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl px-4 py-3 text-sm text-red-400"
                style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)' }}>
                {error}
              </div>
            )}

            <button disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
              {!loading && <ArrowRight size={16}/>}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
              className="font-semibold transition-colors hover:text-white" style={{ color: '#a5b0ff' }}>
              {mode === 'login' ? 'Sign up free' : 'Sign in'}
            </button>
          </p>

          <Link to="/" className="mt-6 block text-center text-xs text-slate-600 hover:text-slate-400 transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
