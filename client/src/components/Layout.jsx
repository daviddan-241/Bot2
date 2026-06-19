import { NavLink, useNavigate } from 'react-router-dom';
import { BarChart3, Bot, Megaphone, Menu, Moon, Search, Sun, UsersRound, LogOut, PlugZap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const nav = [
  { to: '/app', label: 'Dashboard', icon: BarChart3 },
  { to: '/leads', label: 'Leads', icon: UsersRound },
  { to: '/scraper', label: 'Scraper', icon: Search },
  { to: '/campaigns', label: 'Campaigns', icon: Megaphone },
  { to: '/ai', label: 'AI Brain', icon: Bot },
  { to: '/connections', label: 'Connections', icon: PlugZap }
];

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-500 text-lg font-black text-white shadow-glow">LF</div>
      <div>
        <p className="text-sm font-black leading-4 text-slate-950 dark:text-white">LeadFlow AI</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">AI CRM + Outreach</p>
      </div>
    </div>
  );
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dark, setDark] = useState(() => localStorage.getItem('leadflow_theme') === 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('leadflow_theme', dark ? 'dark' : 'light');
  }, [dark]);

  const doLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,.16),transparent_28%),linear-gradient(180deg,#f8fafc,#eef2f7)] pb-24 text-slate-900 dark:bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,.22),transparent_28%),linear-gradient(180deg,#0B1220,#101827)] dark:text-white lg:pb-0">
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-72 border-r border-slate-200/80 bg-white/70 p-5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/60 lg:block">
        <Logo />
        <nav className="mt-8 space-y-2">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${isActive ? 'bg-blue-600 text-white shadow-glow' : 'text-slate-600 hover:bg-slate-100 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-white/5'}`}>
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-5 left-5 right-5 rounded-3xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
          <p className="text-xs text-slate-500 dark:text-slate-400">Signed in as</p>
          <p className="truncate text-sm font-bold text-slate-950 dark:text-white">{user?.email}</p>
          <button onClick={doLogout} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-red-50 hover:text-red-600 dark:bg-white/5 dark:text-slate-200"><LogOut size={16}/> Logout</button>
        </div>
      </aside>

      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/75 px-4 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70 lg:ml-72 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="lg:hidden"><Logo /></div>
          <div className="hidden lg:block">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-blue-600">Apollo-style workspace</p>
            <h1 className="text-xl font-black text-slate-950 dark:text-white">Find, score, and reach qualified leads</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setDark((v) => !v)} className="btn-secondary !rounded-full !px-3" aria-label="Toggle theme">{dark ? <Sun size={18}/> : <Moon size={18}/>}</button>
            <button className="btn-secondary !rounded-full !px-3 lg:hidden"><Menu size={18}/></button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 lg:ml-72 lg:px-8">{children}</main>

      <nav className="fixed bottom-3 left-3 right-3 z-40 grid grid-cols-6 rounded-[28px] border border-slate-200 bg-white/90 p-2 shadow-soft backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/90 lg:hidden">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[10px] font-bold ${isActive ? 'bg-blue-600 text-white' : 'text-slate-500 dark:text-slate-400'}`}>
            <Icon size={18}/><span>{label.split(' ')[0]}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
