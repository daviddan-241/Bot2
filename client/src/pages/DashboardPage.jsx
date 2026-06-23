import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Code2, Megaphone, Search, TrendingUp, UsersRound, Zap } from 'lucide-react';
import { api } from '../utils/api.js';
import StatCard from '../components/StatCard.jsx';
import ScoreBadge from '../components/ScoreBadge.jsx';
import EmptyState from '../components/EmptyState.jsx';

function Skeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1,2,3].map(i => <div key={i} className="rounded-2xl h-28 skeleton"/>)}
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-2xl h-56 skeleton"/>
        <div className="rounded-2xl h-56 skeleton"/>
      </div>
    </div>
  );
}

const QUICK_LINKS = [
  { to: '/scraper',   label: 'Discover leads',   icon: Search,   color: '#5c67ff', desc: 'Find businesses worldwide' },
  { to: '/ai',        label: 'AI assistant',      icon: Zap,      color: '#7c3aed', desc: 'Chat with AI' },
  { to: '/generate',  label: 'Generate MVP',      icon: Code2,    color: '#06b6d4', desc: 'Build project proposals' },
  { to: '/campaigns', label: 'Run campaign',      icon: Megaphone,color: '#10b981', desc: 'Send outreach' },
];

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/dashboard').then(setData).catch(err => setError(err.message));
  }, []);

  if (error) return (
    <EmptyState title="Could not load dashboard" text={error}
      action={<button onClick={() => window.location.reload()} className="btn-secondary">Retry</button>}/>
  );
  if (!data) return <Skeleton />;

  const dist = { Hot: 0, Warm: 0, Cold: 0 };
  data.distribution?.forEach(d => { dist[d.label] = d.count; });
  const max = Math.max(1, ...Object.values(dist));

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">Overview</p>
          <h1 className="text-2xl font-black text-white">Dashboard</h1>
        </div>
        <Link to="/scraper" className="btn-primary text-sm">
          <Search size={15}/> Find leads
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total leads" value={data.totalLeads ?? 0} hint="Stored in database" accent="default" icon={UsersRound}/>
        <StatCard label="Avg AI score" value={data.avgScore ?? 0} hint="AI + rule engine" accent="green" icon={TrendingUp}/>
        <StatCard label="Active campaigns" value={data.campaigns?.length ?? 0} hint="Email & WhatsApp" accent="amber" icon={Megaphone}/>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {QUICK_LINKS.map(({ to, label, icon: Icon, color, desc }) => (
          <Link key={to} to={to}
            className="rounded-2xl p-4 transition-all hover:-translate-y-1 group"
            style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)' }}>
            <div className="h-9 w-9 rounded-xl flex items-center justify-center mb-3"
              style={{ background: `${color}15`, border: `1px solid ${color}20` }}>
              <Icon size={16} color={color}/>
            </div>
            <p className="text-sm font-semibold text-white leading-tight">{label}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{desc}</p>
          </Link>
        ))}
      </div>

      {/* Score dist + Recent leads */}
      <div className="grid lg:grid-cols-2 gap-4">

        {/* Score distribution */}
        <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)' }}>
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 size={16} color="#a5b0ff"/>
            <h3 className="text-sm font-bold text-white">Lead score distribution</h3>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Hot',  color: '#34d399', bg: 'rgba(52,211,153,.2)'  },
              { label: 'Warm', color: '#fbbf24', bg: 'rgba(251,191,36,.2)'  },
              { label: 'Cold', color: '#64748b', bg: 'rgba(100,116,139,.2)' },
            ].map(({ label, color, bg }) => (
              <div key={label}>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-medium text-slate-300">{label}</span>
                  <span className="font-bold text-white">{dist[label]}</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,.06)' }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${(dist[label] / max) * 100}%`, background: color }}/>
                </div>
              </div>
            ))}
          </div>
          {data.totalLeads === 0 && (
            <p className="mt-6 text-xs text-slate-600 text-center">Run lead discovery to populate this chart</p>
          )}
        </div>

        {/* Recent leads */}
        <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)' }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <UsersRound size={16} color="#a5b0ff"/>
              <h3 className="text-sm font-bold text-white">Recent leads</h3>
            </div>
            <Link to="/leads" className="text-xs font-medium hover:text-white transition-colors" style={{ color: '#a5b0ff' }}>View all</Link>
          </div>

          {data.recentLeads?.length ? (
            <div className="space-y-1">
              {data.recentLeads.map(lead => (
                <Link key={lead.id} to={`/leads/${lead.id}`}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all hover:bg-white/5 group">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ background: 'rgba(92,103,255,.15)' }}>
                    {(lead.company || lead.name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white truncate">{lead.company || lead.name}</p>
                    <p className="text-xs text-slate-500 truncate">{lead.email || lead.website || 'No contact'}</p>
                  </div>
                  <ScoreBadge score={lead.score} label={lead.score_label}/>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="No leads yet" text="Run the scraper to discover real businesses."/>
          )}
        </div>
      </div>

      {/* Campaigns */}
      <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)' }}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Megaphone size={16} color="#fbbf24"/>
            <h3 className="text-sm font-bold text-white">Campaign activity</h3>
          </div>
          <Link to="/campaigns" className="btn-secondary text-xs py-1.5 px-3">Manage</Link>
        </div>
        {data.campaigns?.length ? (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {data.campaigns.map(c => (
              <Link to="/campaigns" key={c.id}
                className="rounded-xl px-4 py-3 transition-all hover:bg-white/5"
                style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.06)' }}>
                <p className="text-sm font-semibold text-white">{c.name}</p>
                <p className="text-xs text-slate-500 mt-0.5 capitalize">{c.channel} · {c.status}</p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No campaigns yet. <Link to="/campaigns" className="text-brand-400 hover:underline">Create one</Link></p>
        )}
      </div>
    </div>
  );
}
