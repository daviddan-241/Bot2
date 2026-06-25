import { NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { BarChart3, Bot, Code2, Megaphone, Search, Settings, UsersRound, LogOut, Zap, WifiOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import Logo from './Logo.jsx';

const NAV = [
  { to: '/app',        label: 'Dashboard',  icon: BarChart3 },
  { to: '/leads',      label: 'Leads',      icon: UsersRound },
  { to: '/scraper',    label: 'Discover',   icon: Search },
  { to: '/campaigns',  label: 'Campaigns',  icon: Megaphone },
  { to: '/ai',         label: 'AI Chat',    icon: Bot },
  { to: '/generate',   label: 'MVP Builder',icon: Code2 },
  { to: '/connections',label: 'Settings',   icon: Settings },
];

const TAB_BAR = [
  { to: '/ai',        label: 'FlowAI',  icon: Bot },
  { to: '/leads',     label: 'Leads',   icon: UsersRound },
  { to: '/kanban',    label: 'Pipeline',icon: Zap },
  { to: '/campaigns', label: 'Outreach',icon: Megaphone },
  { to: '/connections',label: 'Settings',icon: Settings },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  const doLogout = () => { logout(); navigate('/login'); };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || 'ME';

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100dvh', overscrollBehavior: 'none' }}>

      {/* ── Offline banner ── */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 py-2 text-xs font-semibold"
          style={{ background: '#FEF3C7', color: '#92400E', paddingTop: 'calc(8px + env(safe-area-inset-top, 0px))' }}>
          <WifiOff size={13}/> You're offline — cached data shown
        </div>
      )}

      {/* ── Desktop Sidebar ── */}
      <aside className="fixed left-0 top-0 bottom-0 z-40 hidden lg:flex flex-col w-60"
        style={{
          borderRight: '1px solid var(--border)',
          background: 'var(--surface)',
        }}>

        <div className="px-5 pt-6 pb-4">
          <Logo size={32} textSize="text-[15px]"/>
        </div>

        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          <p className="px-3 mb-1.5 mt-1 text-[10px] font-bold uppercase tracking-[.15em]" style={{ color: 'var(--text-3)' }}>
            Workspace
          </p>
          {NAV.slice(0, 5).map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/app'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                  isActive ? '' : 'hover:bg-[var(--surface-2)]'
                }`
              }
              style={({ isActive }) => isActive
                ? { background: 'var(--brand-light)', color: 'var(--brand)', fontWeight: 600 }
                : { color: 'var(--text-2)' }
              }>
              {({ isActive }) => (
                <>
                  <Icon size={16} color={isActive ? 'var(--brand)' : 'var(--text-3)'}/>
                  {label}
                </>
              )}
            </NavLink>
          ))}

          <p className="px-3 mb-1.5 mt-5 text-[10px] font-bold uppercase tracking-[.15em]" style={{ color: 'var(--text-3)' }}>
            Tools
          </p>
          {NAV.slice(5).map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                  isActive ? '' : 'hover:bg-[var(--surface-2)]'
                }`
              }
              style={({ isActive }) => isActive
                ? { background: 'var(--brand-light)', color: 'var(--brand)', fontWeight: 600 }
                : { color: 'var(--text-2)' }
              }>
              {({ isActive }) => (
                <>
                  <Icon size={16} color={isActive ? 'var(--brand)' : 'var(--text-3)'}/>
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3 rounded-xl p-3" style={{ background: 'var(--surface-2)' }}>
            <div className="h-8 w-8 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ background: 'var(--brand)' }}>
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{user?.name || 'User'}</p>
              <p className="text-[11px] truncate" style={{ color: 'var(--text-3)' }}>{user?.email}</p>
            </div>
            <button onClick={doLogout} title="Sign out"
              className="h-8 w-8 rounded-lg flex items-center justify-center transition-colors hover:bg-red-50"
              style={{ color: 'var(--text-3)' }}>
              <LogOut size={14}/>
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
          background: 'rgba(248,250,252,0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border)',
        }}>
        <Logo size={28} textSize="text-[15px]"/>
        <div className="flex items-center gap-2">
          <NavLink to="/ai"
            className="h-9 px-4 rounded-xl flex items-center gap-2 text-sm font-semibold transition-colors"
            style={{ background: 'var(--brand)', color: 'white' }}>
            <Zap size={14}/> Ask AI
          </NavLink>
          <NavLink to="/connections"
            className="h-9 w-9 rounded-xl flex items-center justify-center transition-colors hover:bg-[var(--surface-2)]"
            style={{ color: 'var(--text-3)', background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <Settings size={16}/>
          </NavLink>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="lg:pl-60"
        style={{
          paddingTop: 'calc(60px + max(14px, env(safe-area-inset-top, 14px)))',
          paddingBottom: 'calc(72px + max(20px, env(safe-area-inset-bottom, 20px)))',
        }}>
        <div className="max-w-5xl mx-auto px-4 py-5 lg:px-8 lg:py-8 animate-fade-up">
          {children}
        </div>
      </main>

      {/* ── iOS Tab Bar ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-end justify-around"
        style={{
          background: 'rgba(248,250,252,0.96)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderTop: '1px solid var(--border)',
          paddingBottom: 'max(20px, env(safe-area-inset-bottom, 20px))',
          paddingTop: 8,
          paddingLeft: 4,
          paddingRight: 4,
        }}>
        {TAB_BAR.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/app'}
            className="flex flex-col items-center gap-1 py-1 px-3 transition-all duration-150"
            style={{ minWidth: 52 }}>
            {({ isActive }) => (
              <>
                <div className="h-8 w-8 rounded-xl flex items-center justify-center transition-all duration-150"
                  style={isActive ? { background: 'var(--brand-light)' } : {}}>
                  <Icon size={18} color={isActive ? 'var(--brand)' : 'var(--text-3)'}/>
                </div>
                <span className="text-[10px] font-semibold"
                  style={{ color: isActive ? 'var(--brand)' : 'var(--text-3)' }}>
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
