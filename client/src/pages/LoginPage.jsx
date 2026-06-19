import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const { user, login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,.25),transparent_32%),linear-gradient(135deg,#eef4ff,#ffffff_45%,#edfdf5)] px-4 py-8 dark:bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,.35),transparent_32%),linear-gradient(135deg,#0B1220,#111827_55%,#0f172a)]">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full gap-6 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
          <section className="glass-card overflow-hidden p-8 lg:p-12">
            <div className="mb-8 inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">LeadFlow AI SaaS Workspace</div>
            <h1 className="max-w-2xl text-4xl font-black tracking-tight text-slate-950 dark:text-white sm:text-6xl">Apollo-style CRM powered by local AI.</h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-slate-600 dark:text-slate-300">Find businesses through legal search APIs, enrich public websites, score leads with Ollama/Groq/HuggingFace fallback, then send compliant email and WhatsApp outreach with delay controls.</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {['CRM persistence', 'AI scoring', 'SMTP + WhatsApp'].map((item) => <div key={item} className="rounded-2xl border border-slate-200 bg-white/70 p-4 text-sm font-bold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">✓ {item}</div>)}
            </div>
          </section>

          <form onSubmit={submit} className="glass-card p-6 sm:p-8">
            <div className="mb-6">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-500 text-lg font-black text-white shadow-glow">LF</div>
              <h2 className="mt-4 text-2xl font-black text-slate-950 dark:text-white">{mode === 'login' ? 'Welcome back' : 'Create account'}</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Secure JWT auth with bcrypt password hashing.</p>
            </div>
            {mode === 'register' && <label className="mb-4 block"><span className="label">Name</span><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>}
            <label className="mb-4 block"><span className="label">Email</span><input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label>
            <label className="mb-5 block"><span className="label">Password</span><input className="input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} /></label>
            {error && <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">{error}</div>}
            <button disabled={loading} className="btn-primary w-full">{loading ? 'Working…' : mode === 'login' ? 'Login' : 'Register'}</button>
            <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="mt-4 w-full text-sm font-bold text-blue-600 hover:text-blue-500">{mode === 'login' ? 'Need an account? Register' : 'Already have an account? Login'}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
