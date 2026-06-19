import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api.js';
import StatCard from '../components/StatCard.jsx';
import ScoreBadge from '../components/ScoreBadge.jsx';
import EmptyState from '../components/EmptyState.jsx';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api('/dashboard').then(setData).catch((err) => setError(err.message)); }, []);
  if (error) return <EmptyState title="API unavailable" text={error} />;
  if (!data) return <div className="grid gap-4 sm:grid-cols-3"><div className="glass-card h-36 animate-pulse"/><div className="glass-card h-36 animate-pulse"/><div className="glass-card h-36 animate-pulse"/></div>;

  const dist = { Hot: 0, Warm: 0, Cold: 0 };
  data.distribution?.forEach((d) => { dist[d.label] = d.count; });
  const max = Math.max(1, ...Object.values(dist));

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[.2em] text-blue-600">Dashboard</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">Lead command center</h2>
        </div>
        <Link to="/scraper" className="btn-primary">Run lead discovery</Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total leads" value={data.totalLeads} hint="Persisted in SQLite" />
        <StatCard label="Average score" value={data.avgScore} hint="AI + rule hybrid" accent="green" />
        <StatCard label="Active campaigns" value={data.campaigns?.length || 0} hint="Email / WhatsApp" accent="amber" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
        <section className="glass-card p-5">
          <h3 className="text-lg font-black text-slate-950 dark:text-white">Lead score distribution</h3>
          <div className="mt-6 space-y-5">
            {Object.entries(dist).map(([label, count]) => (
              <div key={label}>
                <div className="mb-2 flex items-center justify-between text-sm font-bold"><span>{label}</span><span>{count}</span></div>
                <div className="h-3 rounded-full bg-slate-100 dark:bg-white/10"><div className={`h-3 rounded-full ${label === 'Hot' ? 'bg-emerald-500' : label === 'Warm' ? 'bg-amber-500' : 'bg-slate-400'}`} style={{ width: `${(count / max) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-card p-5">
          <div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-black text-slate-950 dark:text-white">Recent leads</h3><Link className="text-sm font-bold text-blue-600" to="/leads">View all</Link></div>
          {data.recentLeads?.length ? <div className="divide-y divide-slate-100 dark:divide-white/10">{data.recentLeads.map((lead) => (
            <Link key={lead.id} to={`/leads/${lead.id}`} className="flex items-center justify-between gap-3 py-3 transition hover:opacity-80">
              <div className="min-w-0"><p className="truncate font-bold text-slate-950 dark:text-white">{lead.company || lead.name}</p><p className="truncate text-sm text-slate-500 dark:text-slate-400">{lead.email || lead.website || 'No contact yet'}</p></div>
              <ScoreBadge score={lead.score} label={lead.score_label}/>
            </Link>
          ))}</div> : <EmptyState title="No leads yet" text="Run the scraper or add your first lead manually." />}
        </section>
      </div>

      <section className="glass-card p-5">
        <h3 className="text-lg font-black text-slate-950 dark:text-white">Campaign activity</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data.campaigns?.length ? data.campaigns.map((c) => <Link to="/campaigns" key={c.id} className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-1 hover:border-blue-200 dark:border-white/10 dark:bg-slate-950"><p className="font-bold">{c.name}</p><p className="mt-1 text-sm text-slate-500">{c.channel} • {c.status}</p></Link>) : <p className="text-sm text-slate-500 dark:text-slate-400">No campaigns created yet.</p>}
        </div>
      </section>
    </div>
  );
}
