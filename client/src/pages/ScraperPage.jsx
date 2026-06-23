import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Globe2, Play, RefreshCw, Search, Sparkles } from 'lucide-react';
import { api } from '../utils/api.js';
import ScoreBadge from '../components/ScoreBadge.jsx';

const STATUS_COLOR = {
  running: 'text-[#5c67ff] bg-[rgba(92,103,255,.12)]',
  queued:  'text-amber-400 bg-amber-400/10',
  done:    'text-emerald-400 bg-emerald-400/10',
  error:   'text-red-400 bg-red-400/10',
};

export default function ScraperPage() {
  const [form, setForm] = useState({ niche: 'dentists', region: 'north_america_europe', location: '', customLocations: '', industry: 'Healthcare', limit: 25 });
  const [regions, setRegions] = useState([]);
  const [job, setJob] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadJobs() { try { const data = await api('/leads/scrape/jobs'); setJobs(data.jobs); } catch {} }
  async function loadRegions() { try { const data = await api('/leads/scrape/regions'); setRegions(data.regions); } catch {} }
  useEffect(() => { loadJobs(); loadRegions(); }, []);
  useEffect(() => {
    if (!job || !['queued','running'].includes(job.status)) return;
    const t = setInterval(async () => {
      try { const data = await api(`/leads/scrape/${job.id}`); setJob(data.job); if (!['queued','running'].includes(data.job.status)) loadJobs(); } catch (err) { setError(err.message); }
    }, 2200);
    return () => clearInterval(t);
  }, [job?.id, job?.status]);

  async function run(e) {
    e.preventDefault(); setLoading(true); setError(''); setJob(null);
    const locations = form.customLocations.split('\n').map((x) => x.trim()).filter(Boolean);
    try {
      const data = await api('/leads/scrape', {
        method: 'POST',
        body: { niche: form.niche, region: form.region, location: form.location || undefined, locations, industry: form.industry, limit: Number(form.limit) }
      });
      setJob(data.job); loadJobs();
    }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  const selectedRegion = regions.find((r) => r.id === form.region);

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <p className="text-xs font-bold uppercase tracking-[.2em] text-[#5c67ff]">Real Lead Discovery</p>
        <h2 className="mt-2 text-3xl font-black text-white">Worldwide Scraper</h2>
        <p className="mt-1 max-w-2xl text-sm text-slate-400 leading-6">Find real businesses across every continent using Google Places, OpenStreetMap, Serper, and Brave Search. Zero mock data — every lead is a real stored contact.</p>
      </div>

      <section className="card p-5 sm:p-6">
        <form onSubmit={run} className="space-y-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_140px] lg:items-end">
            <label>
              <span className="label">Business niche</span>
              <input className="input" value={form.niche} onChange={(e) => setForm({ ...form, niche: e.target.value })} placeholder="dentists, lawyers, gyms…" required />
            </label>
            <label>
              <span className="label">Target region</span>
              <select className="input" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })}>
                <option value="north_america_europe">Americas + Europe</option>
                <option value="global">Global (all regions)</option>
                {regions.filter((r) => r.id !== 'north_america_europe').map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
            </label>
            <label>
              <span className="label">Industry tag</span>
              <input className="input" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
            </label>
            <label>
              <span className="label">Lead limit</span>
              <input className="input" type="number" min="1" max="100" value={form.limit} onChange={(e) => setForm({ ...form, limit: e.target.value })} />
            </label>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
            <label>
              <span className="label">Location override (optional)</span>
              <input className="input" placeholder="e.g. Austin, United States" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </label>
            <label>
              <span className="label">Custom locations (one per line)</span>
              <textarea className="input min-h-[88px] resize-none" placeholder={'Paris, France\nToronto, Canada\nDubai, UAE'} value={form.customLocations} onChange={(e) => setForm({ ...form, customLocations: e.target.value })} />
            </label>
            <button disabled={loading} className="btn-primary h-11 px-6 self-end">
              {loading ? <><RefreshCw size={15} className="animate-spin"/> Starting…</> : <><Play size={15}/> Find leads</>}
            </button>
          </div>
        </form>

        <div className="mt-5 rounded-xl border border-white/[.06] bg-white/[.02] p-4 flex items-start gap-3">
          <Globe2 size={17} className="mt-0.5 text-[#5c67ff] shrink-0"/>
          <div>
            <p className="text-sm font-bold text-white">Coverage: {selectedRegion?.label || (form.region === 'global' ? 'Global — all regions' : 'Custom locations only')}</p>
            <p className="mt-1 text-xs text-slate-400 leading-5">
              {form.region === 'global' ? 'All regional presets activated — stops at your lead limit.' : selectedRegion ? `${selectedRegion.count} target cities/countries. Stops when limit reached.` : 'Using your custom location list only.'}
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-semibold text-red-400">{error}</div>
        )}
      </section>

      {job && (
        <section className="card p-5 sm:p-6 space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-black text-white">Job #{job.id}</h3>
                <span className={`rounded-full px-3 py-0.5 text-xs font-bold capitalize ${STATUS_COLOR[job.status] || 'text-slate-400 bg-white/5'}`}>{job.status}</span>
              </div>
              <p className="mt-1 text-sm text-slate-400">{job.query} • <span className="text-white font-semibold">{job.result_count}</span> leads found</p>
            </div>
            <button onClick={async () => setJob((await api(`/leads/scrape/${job.id}`)).job)} className="btn-secondary">
              <RefreshCw size={15}/> Refresh
            </button>
          </div>

          {['queued','running'].includes(job.status) && (
            <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
              <div className="h-full rounded-full animate-pulse" style={{ width: '60%', background: 'linear-gradient(90deg,#5c67ff,#7c3aed)' }}/>
            </div>
          )}

          {job.error && <pre className="rounded-xl bg-amber-500/10 p-3 text-xs text-amber-300 overflow-auto max-h-40">{job.error}</pre>}

          {job.leads?.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {job.leads.map((lead) => (
                <Link key={lead.id} to={`/leads/${lead.id}`}
                  className="rounded-xl border border-white/[.06] bg-white/[.02] p-4 transition-all hover:border-[rgba(92,103,255,.3)] hover:bg-[rgba(92,103,255,.06)] hover:-translate-y-0.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-white truncate">{lead.company || lead.name}</p>
                      <p className="mt-0.5 text-xs text-slate-400 truncate">{lead.email || lead.phone || lead.website || lead.location}</p>
                    </div>
                    <ScoreBadge score={lead.score} label={lead.score_label}/>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="card p-5 sm:p-6">
        <h3 className="mb-4 text-base font-black text-white">Recent discovery jobs</h3>
        {jobs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 p-10 text-center">
            <Search className="mx-auto mb-3 text-slate-600" size={24}/>
            <p className="text-sm text-slate-500">No jobs yet. Run your first real lead discovery above.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {jobs.map((j) => (
              <button key={j.id} onClick={async () => setJob((await api(`/leads/scrape/${j.id}`)).job)}
                className="rounded-xl border border-white/[.06] bg-white/[.02] p-4 text-left transition-all hover:border-[rgba(92,103,255,.3)] hover:bg-[rgba(92,103,255,.06)]">
                <p className="font-bold text-white">{j.query}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold capitalize ${STATUS_COLOR[j.status] || 'text-slate-400 bg-white/5'}`}>{j.status}</span>
                  <span className="text-xs text-slate-400">{j.result_count} leads</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
