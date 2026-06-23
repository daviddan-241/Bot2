import { NavLink, useNavigate } from 'react-router-dom';
import { BarChart3, Bot, Code2, Megaphone, Search, Settings, UsersRound, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const NAV = [
  { to: '/app',        label: 'Dashboard',  icon: BarChart3 },
  { to: '/leads',      label: 'Leads',      icon: UsersRound },
  { to: '/scraper',    label: 'Discover',   icon: Search },
  { to: '/campaigns',  label: 'Campaigns',  icon: Megaphone },
  { to: '/ai',         label: 'AI Chat',    icon: Bot },
  { to: '/generate',   label: 'Generator',  icon: Code2 },
  { to: '/connections',label: 'Settings',   icon: Settings },
];

const TAB_BAR = [
  { to: '/app',       label: 'Home',    icon: BarChart3 },
  { to: '/leads',     label: 'Leads',   icon: UsersRound },
  { to: '/ai',        label: 'AI',      icon: Bot },
  { to: '/generate',  label: 'Build',   icon: Code2 },
  { to: '/scraper',   label: 'Find',    icon: Search },
];

function FlowLogo({ size = 32 }) {
  return (
    <div style={{
      width: size, height: size,
      background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
      borderRadius: size * 0.28,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 4px 16px rgba(99,102,241,.35)',
      flexShrink: 0,
    }}>
      <svg viewBox="0 0 20 20" fill="none" width={size * 0.55} height={size * 0.55}>
        <rect x="3" y="3" width="5" height="14" rx="1.5" fill="white"/>
        <rect x="3" y="3" width="14" height="5" rx="1.5" fill="white"/>
        <rect x="3" y="8.5" width="10" height="4" rx="1.5" fill="white" opacity="0.8"/>
      </svg>
    </div>
  );
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const doLogout = () => { logout(); navigate('/login'); };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || 'ME';

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100dvh', overscrollBehavior: 'none' }}>

      {/* ── Desktop Sidebar ── */}
      <aside className="fixed left-0 top-0 bottom-0 z-40 hidden lg:flex flex-col w-64"
        style={{
          borderRight: '1px solid var(--border)',
          background: 'rgba(8,8,15,0.96)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }}>

        <div className="px-5 pt-7 pb-5">
          <div className="flex items-center gap-3">
            <FlowLogo size={36}/>
            <div>
              <p className="text-base font-black text-white tracking-tight">FlowAI</p>
              <p className="text-[11px] text-slate-500 font-medium">AI Lead Engine</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          <p className="px-3 mb-2 mt-1 text-[10px] font-bold uppercase tracking-[.15em] text-slate-600">Workspace</p>
          {NAV.slice(0, 5).map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/app'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 group ${
                  isActive ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-white/[.05]'
                }`
              }
              style={({ isActive }) => isActive ? {
                background: 'rgba(99,102,241,.12)',
                border: '1px solid rgba(99,102,241,.18)',
                color: '#a5b4fc',
              } : {}}>
              <Icon size={16}/>
              {label}
            </NavLink>
          ))}

          <p className="px-3 mb-2 mt-5 text-[10px] font-bold uppercase tracking-[.15em] text-slate-600">Tools</p>
          {NAV.slice(5).map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                  isActive ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-white/[.05]'
                }`
              }
              style={({ isActive }) => isActive ? {
                background: 'rgba(99,102,241,.12)',
                border: '1px solid rgba(99,102,241,.18)',
                color: '#a5b4fc',
              } : {}}>
              <Icon size={16}/>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 mt-2">
          <div className="rounded-2xl p-4" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-9 w-9 rounded-xl flex items-center justify-center text-xs font-black text-white shrink-0"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate">{user?.name || 'User'}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button onClick={doLogout}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold text-slate-400 hover:text-red-400 transition-colors"
              style={{ background: 'rgba(255,255,255,.04)' }}>
              <LogOut size={12}/> Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* ── iOS Mobile Header ── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between"
        style={{
          paddingLeft: 16, paddingRight: 16,
          paddingTop: 'max(14px, env(safe-area-inset-top, 14px))',
          paddingBottom: 12,
          background: 'rgba(8,8,15,0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,.06)',
        }}>
        <div className="flex items-center gap-2.5">
          <FlowLogo size={32}/>
          <span className="text-base font-black text-white tracking-tight">FlowAI</span>
        </div>
        <div className="flex items-center gap-2">
          <NavLink to="/connections"
            className="h-9 w-9 rounded-xl flex items-center justify-center text-slate-400"
            style={{ background: 'rgba(255,255,255,.06)' }}>
            <Settings size={16}/>
          </NavLink>
          <div className="h-9 w-9 rounded-xl flex items-center justify-center text-xs font-black text-white"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
            {initials}
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="lg:pl-64"
        style={{
          paddingTop: 'calc(60px + max(14px, env(safe-area-inset-top, 14px)) + 12px)',
          paddingBottom: 'calc(72px + max(20px, env(safe-area-inset-bottom, 20px)))',
        }}>
        <div className="lg:pt-6 lg:pb-8 mx-auto max-w-5xl px-4 py-4 lg:px-8 animate-fade-up"
          style={{ paddingTop: 20 }}>
          {children}
        </div>
      </main>

      {/* ── iOS Tab Bar ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-end justify-around"
        style={{
          background: 'rgba(8,8,15,0.92)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderTop: '0.5px solid rgba(255,255,255,.08)',
          paddingBottom: 'max(20px, env(safe-area-inset-bottom, 20px))',
          paddingTop: 8,
          paddingLeft: 4,
          paddingRight: 4,
        }}>
        {TAB_BAR.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/app'}
            className="flex flex-col items-center gap-1 py-1 px-3 transition-all duration-150"
            style={({ isActive }) => ({ opacity: isActive ? 1 : 0.42, minWidth: 52 })}>
            {({ isActive }) => (
              <>
                <div className="h-8 w-8 rounded-xl flex items-center justify-center transition-all duration-150"
                  style={isActive ? { background: 'rgba(99,102,241,.18)' } : {}}>
                  <Icon size={18} color={isActive ? '#a5b4fc' : '#94a3b8'}/>
                </div>
                <span className="text-[10px] font-semibold"
                  style={{ color: isActive ? '#a5b4fc' : '#64748b', letterSpacing: '-0.01em' }}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
