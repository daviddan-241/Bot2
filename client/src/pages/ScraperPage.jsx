import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Globe2, Play, RefreshCw, Search } from 'lucide-react';
import { api } from '../utils/api.js';
import ScoreBadge from '../components/ScoreBadge.jsx';

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
    <div className="space-y-5">
      <div><p className="text-sm font-bold uppercase tracking-[.2em] text-blue-600">Global legal lead discovery</p><h2 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">Worldwide scraper pipeline</h2><p className="mt-1 max-w-3xl text-sm text-slate-500 dark:text-slate-400">Auto-target America, Europe, Africa, Asia Pacific, the Middle East, Latin America, and Oceania. LeadFlow only stores real leads returned by legal APIs/OpenStreetMap and public websites — no demo data, no mock leads, no protected Google Maps scraping.</p></div>

      <section className="glass-card p-5">
        <form onSubmit={run} className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_120px] lg:items-end">
            <label><span className="label">Niche</span><input className="input" value={form.niche} onChange={(e) => setForm({ ...form, niche: e.target.value })} required /></label>
            <label><span className="label">Auto region</span><select className="input" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })}><option value="north_america_europe">America + Europe auto</option><option value="global">Whole world auto</option>{regions.filter((r) => r.id !== 'north_america_europe').map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}</select></label>
            <label><span className="label">Industry</span><input className="input" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} /></label>
            <label><span className="label">Real lead limit</span><input className="input" type="number" min="1" max="100" value={form.limit} onChange={(e) => setForm({ ...form, limit: e.target.value })} /></label>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
            <label><span className="label">Optional single location override</span><input className="input" placeholder="e.g. Austin, United States or Berlin, Germany" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></label>
            <label><span className="label">Optional custom locations, one per line</span><textarea className="input min-h-24" placeholder={'Paris, France\nToronto, Canada\nDubai, United Arab Emirates'} value={form.customLocations} onChange={(e) => setForm({ ...form, customLocations: e.target.value })} /></label>
            <button disabled={loading} className="btn-primary"><Play size={16}/> {loading ? 'Starting…' : 'Find real leads'}</button>
          </div>
        </form>
        <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
          <div className="flex items-start gap-3"><Globe2 className="mt-0.5 text-blue-600" size={18}/><div><p className="text-sm font-black text-slate-800 dark:text-slate-100">Selected coverage: {selectedRegion?.label || (form.region === 'global' ? 'Whole world auto' : 'Custom')}</p><p className="mt-1 text-xs leading-6 text-slate-500 dark:text-slate-400">{form.region === 'global' ? 'Uses all regional presets and stops at your real lead limit.' : selectedRegion ? `${selectedRegion.count} city/country targets available. The job stops when the real lead limit is reached.` : 'Custom locations only.'}</p></div></div>
        </div>
        {error && <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">{error}</div>}
      </section>

      {job && <section className="glass-card p-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h3 className="text-lg font-black">Job #{job.id}: {job.query}</h3><p className="text-sm text-slate-500">Status: <span className="font-bold capitalize text-blue-600">{job.status}</span> • Real stored leads: {job.result_count}</p></div><button onClick={async () => setJob((await api(`/leads/scrape/${job.id}`)).job)} className="btn-secondary"><RefreshCw size={16}/> Refresh</button></div>
        {job.error && <pre className="mt-4 max-h-40 overflow-auto rounded-2xl bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">{job.error}</pre>}
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{job.leads?.map((lead) => <Link key={lead.id} to={`/leads/${lead.id}`} className="rounded-3xl border border-slate-200 bg-white p-4 transition hover:-translate-y-1 hover:border-blue-200 dark:border-white/10 dark:bg-slate-950"><div className="flex justify-between gap-3"><div><p className="font-black text-slate-950 dark:text-white">{lead.company || lead.name}</p><p className="mt-1 line-clamp-1 text-sm text-slate-500">{lead.email || lead.phone || lead.website || lead.location}</p></div><ScoreBadge score={lead.score} label={lead.score_label}/></div></Link>)}</div>
      </section>}

      <section className="glass-card p-5">
        <h3 className="mb-4 text-lg font-black">Recent real discovery jobs</h3>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{jobs.map((j) => <button key={j.id} onClick={async () => setJob((await api(`/leads/scrape/${j.id}`)).job)} className="rounded-3xl border border-slate-200 bg-white p-4 text-left transition hover:border-blue-200 dark:border-white/10 dark:bg-slate-950"><p className="font-black">{j.query}</p><p className="mt-1 text-sm text-slate-500">{j.status} • {j.result_count} real leads</p></button>)}</div>
        {!jobs.length && <div className="rounded-3xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-white/10"><Search className="mx-auto mb-3"/> No jobs yet. Run a live discovery job to store real leads.</div>}
      </section>
    </div>
  );
}
