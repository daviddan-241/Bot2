import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  BarChart3, Bot, Megaphone, Moon, Search, Sun,
  UsersRound, LogOut, Settings, Zap, Code2, ChevronRight
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const NAV = [
  { to: '/app',       label: 'Dashboard',  icon: BarChart3 },
  { to: '/leads',     label: 'Leads',      icon: UsersRound },
  { to: '/scraper',   label: 'Discover',   icon: Search },
  { to: '/campaigns', label: 'Campaigns',  icon: Megaphone },
  { to: '/ai',        label: 'AI Chat',    icon: Bot },
  { to: '/generate',  label: 'Generator',  icon: Code2 },
  { to: '/connections',label: 'Settings',  icon: Settings },
];

const BOTTOM_NAV = [
  { to: '/app',       label: 'Home',    icon: BarChart3 },
  { to: '/leads',     label: 'Leads',   icon: UsersRound },
  { to: '/ai',        label: 'AI',      icon: Bot },
  { to: '/generate',  label: 'Build',   icon: Code2 },
  { to: '/campaigns', label: 'Outreach',icon: Megaphone },
];

function Logo({ collapsed }) {
  return (
    <div className="flex items-center gap-3">
      <div style={{ background: 'linear-gradient(135deg,#5c67ff,#7c3aed)', boxShadow: '0 4px 16px rgba(92,103,255,.35)' }}
        className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0">
        <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
          <path d="M12 3 L20 18 L12 14 L4 18 Z" fill="white" stroke="white" strokeWidth="0.5" strokeLinejoin="round"/>
          <path d="M12 3 L12 14" stroke="rgba(255,255,255,.5)" strokeWidth="1" strokeLinecap="round"/>
        </svg>
      </div>
      {!collapsed && (
        <div>
          <p className="text-sm font-bold leading-tight text-white">FlowAI</p>
          <p className="text-[10px] text-slate-500 leading-tight">AI Lead Engine</p>
        </div>
      )}
    </div>
  );
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dark, setDark] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  const doLogout = () => { logout(); navigate('/login'); };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)
    : user?.email?.slice(0,2).toUpperCase() || 'ME';

  return (
    <div className="min-h-screen min-h-dvh" style={{ background: '#0A0A14' }}>

      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 z-40 hidden lg:flex flex-col w-60 py-5 px-3"
        style={{ borderRight: '1px solid rgba(255,255,255,.06)', background: 'rgba(10,10,20,.92)', backdropFilter: 'blur(20px)' }}>

        <div className="px-2 mb-7"><Logo /></div>

        <nav className="flex-1 space-y-0.5">
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">Workspace</p>
          {NAV.slice(0,5).map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/app'}
              className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${isActive ? 'text-[#a5b0ff] border' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              style={({ isActive }) => isActive ? { background: 'rgba(92,103,255,.1)', borderColor: 'rgba(92,103,255,.2)' } : {}}>
              <Icon size={16} />{label}
            </NavLink>
          ))}

          <p className="px-3 mt-5 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">Tools</p>
          {NAV.slice(5).map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/generate'}
              className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${isActive ? 'text-[#a5b0ff] border' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              style={({ isActive }) => isActive ? { background: 'rgba(92,103,255,.1)', borderColor: 'rgba(92,103,255,.2)' } : {}}>
              <Icon size={16} />{label}
            </NavLink>
          ))}
        </nav>

        {/* User card */}
        <div className="mt-4 rounded-xl p-3" style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)' }}>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ background: 'linear-gradient(135deg,#5c67ff,#7c3aed)' }}>
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{user?.name || 'User'}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={doLogout}
            className="mt-3 w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-400 hover:text-red-400 transition-colors"
            style={{ background: 'rgba(255,255,255,.03)' }}>
            <LogOut size={13}/> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3"
        style={{ background: 'rgba(10,10,20,.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,.06)', paddingTop: 'max(12px, env(safe-area-inset-top))' }}>
        <Logo />
        <div className="flex items-center gap-2">
          <button onClick={() => setDark(v => !v)}
            className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,.05)' }}>
            {dark ? <Sun size={15}/> : <Moon size={15}/>}
          </button>
          <div className="h-8 w-8 rounded-xl flex items-center justify-center text-xs font-bold text-white"
            style={{ background: 'linear-gradient(135deg,#5c67ff,#7c3aed)' }}>
            {initials}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="lg:pl-60 min-h-screen pb-24 lg:pb-8">
        <div className="mx-auto max-w-6xl px-4 py-5 lg:px-8 lg:py-7 animate-fade-up">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-2"
        style={{
          background: 'rgba(10,10,20,.95)',
          backdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(255,255,255,.07)',
          paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
          paddingTop: '8px',
        }}>
        {BOTTOM_NAV.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/app'}
            className={({ isActive }) => `flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all duration-150 min-w-[52px] ${isActive ? '' : 'opacity-40'}`}>
            {({ isActive }) => (
              <>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${isActive ? '' : ''}`}
                  style={isActive ? { background: 'rgba(92,103,255,.15)' } : {}}>
                  <Icon size={17} color={isActive ? '#a5b0ff' : '#94a3b8'} />
                </div>
                <span className="text-[9px] font-semibold" style={{ color: isActive ? '#a5b0ff' : '#64748b' }}>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
