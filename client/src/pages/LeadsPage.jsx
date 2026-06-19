import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MessageCircle, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { api } from '../utils/api.js';
import ScoreBadge from '../components/ScoreBadge.jsx';
import EmptyState from '../components/EmptyState.jsx';

const emptyForm = { name: '', company: '', email: '', phone: '', website: '', industry: '', location: '' };

function LeadForm({ onClose, onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function submit(e) {
    e.preventDefault(); setLoading(true); setError('');
    try { const { lead } = await api('/leads', { method: 'POST', body: form }); onSaved(lead); onClose(); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }
  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-slate-950/40 p-3 backdrop-blur-sm sm:place-items-center">
      <form onSubmit={submit} className="glass-card w-full max-w-2xl p-5 sm:p-7">
        <div className="mb-5 flex items-start justify-between"><div><h3 className="text-xl font-black">Add lead</h3><p className="text-sm text-slate-500">Lead is enriched, WhatsApp-normalized, and AI scored on save.</p></div><button type="button" onClick={onClose} className="btn-secondary !px-3">✕</button></div>
        <div className="grid gap-4 sm:grid-cols-2">
          {Object.keys(emptyForm).map((key) => <label key={key}><span className="label">{key}</span><input className="input" value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} required={key === 'name'} /></label>)}
        </div>
        {error && <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700 dark:bg-red-500/10 dark:text-red-300">{error}</p>}
        <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className="btn-secondary">Cancel</button><button disabled={loading} className="btn-primary">{loading ? 'Saving…' : 'Save lead'}</button></div>
      </form>
    </div>
  );
}

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState('');
  const [label, setLabel] = useState('');
  const [modal, setModal] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const qs = useMemo(() => new URLSearchParams({ q: query, label }).toString(), [query, label]);
  async function load() {
    setLoading(true); setError('');
    try { const data = await api(`/leads?${qs}`); setLeads(data.rows); setTotal(data.total); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [qs]);

  async function rescore(id) { await api(`/leads/${id}/score`, { method: 'POST' }); load(); }
  async function remove(id) { if (confirm('Delete this lead?')) { await api(`/leads/${id}`, { method: 'DELETE' }); load(); } }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-sm font-bold uppercase tracking-[.2em] text-blue-600">CRM</p><h2 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">Leads</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{total} stored contacts with user isolation and SQLite persistence.</p></div>
        <button onClick={() => setModal(true)} className="btn-primary"><Plus size={18}/> Add lead</button>
      </div>

      <section className="glass-card p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_180px]">
          <label className="relative"><Search className="pointer-events-none absolute left-4 top-3.5 text-slate-400" size={18}/><input className="input pl-11" placeholder="Search company, email, industry…" value={query} onChange={(e) => setQuery(e.target.value)} /></label>
          <select className="input" value={label} onChange={(e) => setLabel(e.target.value)}><option value="">All scores</option><option>Hot</option><option>Warm</option><option>Cold</option></select>
        </div>
      </section>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">{error}</div>}
      {loading ? <div className="glass-card h-64 animate-pulse"/> : leads.length === 0 ? <EmptyState title="No leads found" text="Add a lead manually or run legal search API discovery." action={<Link to="/scraper" className="btn-primary">Open scraper</Link>} /> : (
        <section className="glass-card overflow-hidden">
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-white/5 dark:text-slate-400"><tr><th className="px-5 py-4">Company</th><th className="px-5 py-4">Contact</th><th className="px-5 py-4">Industry</th><th className="px-5 py-4">Score</th><th className="px-5 py-4">Source</th><th className="px-5 py-4 text-right">Actions</th></tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/10">{leads.map((lead) => <tr key={lead.id} className="transition hover:bg-blue-50/50 dark:hover:bg-white/[.03]"><td className="px-5 py-4"><Link to={`/leads/${lead.id}`} className="font-black text-slate-950 hover:text-blue-600 dark:text-white">{lead.company || lead.name}</Link><p className="text-xs text-slate-500">{lead.website}</p></td><td className="px-5 py-4"><p>{lead.name}</p><p className="text-xs text-slate-500">{lead.email || lead.phone || 'No contact'}</p></td><td className="px-5 py-4">{lead.industry || 'Unknown'}</td><td className="px-5 py-4"><ScoreBadge score={lead.score} label={lead.score_label}/></td><td className="px-5 py-4"><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold capitalize dark:bg-white/10">{lead.source}</span></td><td className="px-5 py-4"><div className="flex justify-end gap-2"><button onClick={() => rescore(lead.id)} className="btn-secondary !px-3" title="Rescore"><RefreshCw size={16}/></button>{lead.email && <a className="btn-secondary !px-3" href={`mailto:${lead.email}`}><Mail size={16}/></a>}{lead.whatsapp_link && <a className="btn-secondary !px-3" href={lead.whatsapp_link} target="_blank"><MessageCircle size={16}/></a>}<button onClick={() => remove(lead.id)} className="btn-secondary !px-3 hover:!text-red-600"><Trash2 size={16}/></button></div></td></tr>)}</tbody>
            </table>
          </div>
          <div className="grid gap-3 p-3 lg:hidden">{leads.map((lead) => <Link key={lead.id} to={`/leads/${lead.id}`} className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950"><div className="flex items-start justify-between gap-3"><div><p className="font-black text-slate-950 dark:text-white">{lead.company || lead.name}</p><p className="mt-1 text-sm text-slate-500">{lead.email || lead.phone || lead.website}</p></div><ScoreBadge score={lead.score} label={lead.score_label}/></div><p className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-400">{lead.industry || 'Unknown'} • {lead.source}</p></Link>)}</div>
        </section>
      )}
      {modal && <LeadForm onClose={() => setModal(false)} onSaved={() => load()} />}
    </div>
  );
}
