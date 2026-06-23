import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MessageCircle, Plus, RefreshCw, Search, Trash2, UserPlus } from 'lucide-react';
import { api } from '../utils/api.js';
import ScoreBadge from '../components/ScoreBadge.jsx';

const emptyForm = { name: '', company: '', email: '', phone: '', website: '', industry: '', location: '' };
const LABELS = { name: 'Full name', company: 'Company', email: 'Email', phone: 'Phone', website: 'Website', industry: 'Industry', location: 'Location' };

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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-3">
      <form onSubmit={submit} className="card w-full max-w-xl p-5 sm:p-6 animate-fade-up">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h3 className="text-xl font-black text-white">Add lead</h3>
            <p className="mt-0.5 text-sm text-slate-400">AI-scored and WhatsApp-normalized on save.</p>
          </div>
          <button type="button" onClick={onClose} className="btn-secondary !px-3 !py-2">✕</button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {Object.keys(emptyForm).map((key) => (
            <label key={key}>
              <span className="label">{LABELS[key]}</span>
              <input className="input" value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} required={key === 'name'} />
            </label>
          ))}
        </div>
        {error && <p className="mt-4 rounded-xl bg-red-500/10 p-3 text-sm font-semibold text-red-400 border border-red-500/20">{error}</p>}
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button disabled={loading} className="btn-primary">{loading ? 'Saving…' : 'Save lead'}</button>
        </div>
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
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.2em] text-[#5c67ff]">CRM</p>
          <h2 className="mt-2 text-3xl font-black text-white">Leads</h2>
          <p className="mt-1 text-sm text-slate-400">{total.toLocaleString()} stored contacts · AI scored · WhatsApp ready</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary self-start sm:self-auto">
          <UserPlus size={15}/> Add lead
        </button>
      </div>

      <div className="card p-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-3 text-slate-500" size={16}/>
          <input className="input pl-10" placeholder="Search company, email, industry…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <select className="input sm:w-44" value={label} onChange={(e) => setLabel(e.target.value)}>
          <option value="">All scores</option>
          <option>Hot</option>
          <option>Warm</option>
          <option>Cold</option>
        </select>
      </div>

      {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>}

      {loading ? (
        <div className="card h-64 animate-pulse"/>
      ) : leads.length === 0 ? (
        <div className="card p-12 flex flex-col items-center gap-4 text-center">
          <div className="h-14 w-14 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#5c67ff22,#7c3aed22)', border: '1px solid rgba(92,103,255,.2)' }}>
            <Search size={24} className="text-[#5c67ff]"/>
          </div>
          <div>
            <p className="font-black text-white">No leads found</p>
            <p className="mt-1 text-sm text-slate-400">Add manually or run lead discovery to get started.</p>
          </div>
          <Link to="/scraper" className="btn-primary">Open Scraper</Link>
        </div>
      ) : (
        <section className="card overflow-hidden">
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/[.06]">
                  {['Company','Contact','Industry','Score','Source',''].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-b border-white/[.04] transition hover:bg-white/[.02]">
                    <td className="px-5 py-4">
                      <Link to={`/leads/${lead.id}`} className="font-bold text-white hover:text-[#5c67ff] transition-colors">{lead.company || lead.name}</Link>
                      <p className="mt-0.5 text-xs text-slate-500 truncate max-w-[160px]">{lead.website}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-slate-300">{lead.name}</p>
                      <p className="text-xs text-slate-500">{lead.email || lead.phone || '—'}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-400">{lead.industry || '—'}</td>
                    <td className="px-5 py-4"><ScoreBadge score={lead.score} label={lead.score_label}/></td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs font-semibold text-slate-400 capitalize">{lead.source}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => rescore(lead.id)} className="btn-secondary !px-2.5 !py-2" title="Re-score"><RefreshCw size={14}/></button>
                        {lead.email && <a className="btn-secondary !px-2.5 !py-2" href={`mailto:${lead.email}`}><Mail size={14}/></a>}
                        {lead.whatsapp_link && <a className="btn-secondary !px-2.5 !py-2" href={lead.whatsapp_link} target="_blank" rel="noreferrer"><MessageCircle size={14}/></a>}
                        <button onClick={() => remove(lead.id)} className="btn-secondary !px-2.5 !py-2 hover:border-red-500/30 hover:text-red-400"><Trash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 p-3 lg:hidden">
            {leads.map((lead) => (
              <Link key={lead.id} to={`/leads/${lead.id}`}
                className="rounded-xl border border-white/[.06] bg-white/[.02] p-4 transition-all hover:border-[rgba(92,103,255,.3)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-white truncate">{lead.company || lead.name}</p>
                    <p className="mt-0.5 text-sm text-slate-400 truncate">{lead.email || lead.phone || lead.website}</p>
                  </div>
                  <ScoreBadge score={lead.score} label={lead.score_label}/>
                </div>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-600">{lead.industry || 'Unknown'} · {lead.source}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {modal && <LeadForm onClose={() => setModal(false)} onSaved={() => load()} />}
    </div>
  );
}
