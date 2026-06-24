import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Bot, Code2, Mail, Megaphone, Search, TrendingUp, UsersRound, Zap } from 'lucide-react';
import { api } from '../utils/api.js';
import StatCard from '../components/StatCard.jsx';
import ScoreBadge from '../components/ScoreBadge.jsx';
import EmptyState from '../components/EmptyState.jsx';

function Skeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[1,2,3,4,5,6].map(i => <div key={i} className="rounded-2xl h-28 skeleton"/>)}
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-2xl h-56 skeleton"/>
        <div className="rounded-2xl h-56 skeleton"/>
      </div>
    </div>
  );
}

const QUICK_LINKS = [
  { to: '/scraper',   label: 'Find leads',      icon: Search,    color: '#2563EB', bg: '#EFF6FF', desc: 'Discover businesses' },
  { to: '/ai',        label: 'Ask AI',           icon: Bot,       color: '#7C3AED', bg: '#F5F3FF', desc: 'Auto-pipeline' },
  { to: '/generate',  label: 'Generate MVP',     icon: Code2,     color: '#0891B2', bg: '#ECFEFF', desc: 'Build proposals' },
  { to: '/campaigns', label: 'Campaigns',        icon: Megaphone, color: '#D97706', bg: '#FFFBEB', desc: 'Send outreach' },
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

  const emailsSent = data.emailsSent ?? 0;
  const emailsOpened = data.emailsOpened ?? 0;
  const emailsReplied = data.emailsReplied ?? 0;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--text)', letterSpacing: '-0.03em' }}>
            Welcome back,
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-2)' }}>Here's your outreach performance overview</p>
        </div>
        <Link to="/ai" className="btn-primary text-sm">
          <Zap size={15}/> Ask AI
        </Link>
      </div>

      {/* Squibb.ai-style 6-metric grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard
          label="Emails sent"
          value={emailsSent}
          hint="All campaigns"
          accent="default"
          icon={Mail}
          trend={emailsSent > 0 ? '+' + emailsSent : undefined}
        />
        <StatCard
          label="Opened"
          value={emailsOpened}
          hint="Email opens"
          accent="green"
          icon={TrendingUp}
        />
        <StatCard
          label="Replied"
          value={emailsReplied}
          hint="Responses received"
          accent="purple"
          icon={UsersRound}
        />
        <StatCard
          label="Active campaigns"
          value={data.campaigns?.length ?? 0}
          hint="Email & WhatsApp"
          accent="amber"
          icon={Megaphone}
        />
        <StatCard
          label="Leads found"
          value={data.totalLeads ?? 0}
          hint="Stored in CRM"
          accent="cyan"
          icon={Search}
        />
        <StatCard
          label="Avg AI score"
          value={data.avgScore ?? 0}
          hint="Hot = 80+, Warm = 50+"
          accent="red"
          icon={BarChart3}
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {QUICK_LINKS.map(({ to, label, icon: Icon, color, bg, desc }) => (
          <Link key={to} to={to}
            className="rounded-2xl p-4 transition-all hover:shadow-lifted group"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
            <div className="h-9 w-9 rounded-xl flex items-center justify-center mb-3"
              style={{ background: bg }}>
              <Icon size={16} color={color}/>
            </div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{label}</p>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-3)' }}>{desc}</p>
          </Link>
        ))}
      </div>

      {/* Score distribution + Recent leads */}
      <div className="grid lg:grid-cols-2 gap-4">

        {/* Score distribution */}
        <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 size={16} color="var(--brand)"/>
            <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>Lead score distribution</h3>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Hot',  color: '#16A34A', bg: '#F0FDF4', track: '#DCFCE7' },
              { label: 'Warm', color: '#D97706', bg: '#FFFBEB', track: '#FEF3C7' },
              { label: 'Cold', color: '#94A3B8', bg: '#F8FAFC', track: '#E2E8F0' },
            ].map(({ label, color, bg, track }) => (
              <div key={label}>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-medium" style={{ color: 'var(--text-2)' }}>{label}</span>
                  <span className="font-bold" style={{ color: 'var(--text)' }}>{dist[label]}</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: track }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${(dist[label] / max) * 100}%`, background: color }}/>
                </div>
              </div>
            ))}
          </div>
          {data.totalLeads === 0 && (
            <p className="mt-6 text-xs text-center" style={{ color: 'var(--text-3)' }}>
              Ask AI to find leads or use the Discover tool
            </p>
          )}
        </div>

        {/* Recent leads */}
        <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <UsersRound size={16} color="var(--brand)"/>
              <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>Recent leads</h3>
            </div>
            <Link to="/leads" className="text-xs font-semibold transition-colors hover:opacity-70" style={{ color: 'var(--brand)' }}>
              View all
            </Link>
          </div>

          {data.recentLeads?.length ? (
            <div className="space-y-1">
              {data.recentLeads.map(lead => (
                <Link key={lead.id} to={`/leads/${lead.id}`}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all"
                  style={{ ':hover': { background: 'var(--bg)' } }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ background: 'var(--brand)' }}>
                    {(lead.company || lead.name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>
                      {lead.company || lead.name}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-3)' }}>
                      {lead.email || lead.website || 'No contact'}
                    </p>
                  </div>
                  <ScoreBadge score={lead.score} label={lead.score_label}/>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="No leads yet" text="Ask AI to find leads or use the Discover tool."/>
          )}
        </div>
      </div>

      {/* Campaign activity */}
      <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Megaphone size={16} color="#D97706"/>
            <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>Campaign activity</h3>
          </div>
          <Link to="/campaigns" className="btn-secondary text-xs py-1.5 px-3">Manage</Link>
        </div>
        {data.campaigns?.length ? (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {data.campaigns.map(c => (
              <Link to="/campaigns" key={c.id}
                className="rounded-xl px-4 py-3 transition-all"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--brand)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{c.name}</p>
                <p className="text-xs mt-0.5 capitalize" style={{ color: 'var(--text-3)' }}>
                  {c.channel} · {c.status}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-sm" style={{ color: 'var(--text-3)' }}>
              No campaigns yet. <Link to="/ai" className="font-semibold" style={{ color: 'var(--brand)' }}>Ask AI to create one</Link> or{' '}
              <Link to="/campaigns" style={{ color: 'var(--brand)' }}>create manually</Link>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
