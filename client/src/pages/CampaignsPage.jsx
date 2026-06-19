import { useEffect, useState } from 'react';
import { Megaphone, Play, Plus, RefreshCw } from 'lucide-react';
import { api } from '../utils/api.js';
import ScoreBadge from '../components/ScoreBadge.jsx';
import EmptyState from '../components/EmptyState.jsx';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [selected, setSelected] = useState(null);
  const [leads, setLeads] = useState([]);
  const [checked, setChecked] = useState([]);
  const [form, setForm] = useState({ name: '', channel: 'email', tone: 'friendly', subject: '', template: 'Hi {{firstName}},\n\n{{aiMessage}}\n\nBest,' });
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  async function load() {
    const [c, l] = await Promise.all([api('/campaigns'), api('/leads?limit=200')]);
    setCampaigns(c.campaigns); setLeads(l.rows);
    if (selected) setSelected((await api(`/campaigns/${selected.id}`)).campaign);
  }
  useEffect(() => { load().catch((err) => setError(err.message)); }, []);

  async function create(e) {
    e.preventDefault(); setError('');
    try { const data = await api('/campaigns', { method: 'POST', body: form }); setSelected(data.campaign); setCampaigns([data.campaign, ...campaigns]); setForm({ ...form, name: '' }); }
    catch (err) { setError(err.message); }
  }
  async function addLeads() {
    if (!selected || !checked.length) return;
    const data = await api(`/campaigns/${selected.id}/leads`, { method: 'POST', body: { leadIds: checked } });
    setSelected(data.campaign); setChecked([]); setStatus(`${data.added} leads added.`);
  }
  async function run() {
    if (!selected) return;
    const data = await api(`/campaigns/${selected.id}/run`, { method: 'POST', body: { delayMs: 2500, tone: selected.tone } });
    setSelected(data.campaign); setStatus(data.message);
    setTimeout(load, 2500);
  }

  return (
    <div className="space-y-5">
      <div><p className="text-sm font-bold uppercase tracking-[.2em] text-blue-600">Outreach automation</p><h2 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">Campaigns</h2><p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">Create campaigns, assign leads, generate AI-personalized messages, then send via SMTP or WhatsApp Cloud API/link flow with delay controls.</p></div>
      {error && <p className="rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700 dark:bg-red-500/10 dark:text-red-300">{error}</p>}
      {status && <p className="rounded-2xl bg-blue-50 p-3 text-sm font-bold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">{status}</p>}

      <div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
        <section className="space-y-5">
          <form onSubmit={create} className="glass-card p-5">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-black"><Plus size={18}/> New campaign</h3>
            <div className="space-y-3"><input className="input" placeholder="Campaign name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required/><div className="grid grid-cols-2 gap-3"><select className="input" value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}><option value="email">Email</option><option value="whatsapp">WhatsApp</option><option value="multi">Multi-channel</option></select><select className="input" value={form.tone} onChange={(e) => setForm({ ...form, tone: e.target.value })}><option>friendly</option><option>professional</option><option>direct</option><option>warm</option></select></div><input className="input" placeholder="Subject (optional)" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}/><textarea className="input min-h-32" value={form.template} onChange={(e) => setForm({ ...form, template: e.target.value })}/><button className="btn-primary w-full">Create campaign</button></div>
          </form>

          <section className="glass-card p-5">
            <h3 className="mb-4 text-lg font-black">Campaign list</h3>
            <div className="space-y-2">{campaigns.map((c) => <button key={c.id} onClick={async () => setSelected((await api(`/campaigns/${c.id}`)).campaign)} className={`w-full rounded-2xl border p-4 text-left transition ${selected?.id === c.id ? 'border-blue-400 bg-blue-50 dark:bg-blue-500/10' : 'border-slate-200 bg-white hover:border-blue-200 dark:border-white/10 dark:bg-slate-950'}`}><p className="font-black">{c.name}</p><p className="mt-1 text-sm text-slate-500">{c.channel} • {c.status} • sent {c.stats?.sent || 0}</p></button>)}</div>
          </section>
        </section>

        <section className="glass-card p-5">
          {!selected ? <EmptyState title="Select a campaign" text="Create or pick a campaign to assign leads and run outreach." action={<Megaphone/>}/> : <>
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><h3 className="text-xl font-black">{selected.name}</h3><p className="text-sm text-slate-500">{selected.channel} • {selected.status} • {selected.tone}</p></div><div className="flex gap-2"><button onClick={load} className="btn-secondary"><RefreshCw size={16}/> Refresh</button><button onClick={run} className="btn-primary"><Play size={16}/> Run</button></div></div>
            <div className="mt-5 grid gap-3 sm:grid-cols-4">{['queued','sent','failed','skipped'].map((k) => <div key={k} className="rounded-2xl bg-slate-50 p-4 dark:bg-white/5"><p className="text-xs font-bold uppercase text-slate-400">{k}</p><p className="text-2xl font-black">{selected.stats?.[k] || 0}</p></div>)}</div>

            <div className="mt-6"><div className="mb-3 flex items-center justify-between"><h4 className="font-black">Assign leads</h4><button onClick={addLeads} disabled={!checked.length} className="btn-secondary">Add selected ({checked.length})</button></div><div className="max-h-72 overflow-auto rounded-3xl border border-slate-200 dark:border-white/10">{leads.map((lead) => <label key={lead.id} className="flex cursor-pointer items-center gap-3 border-b border-slate-100 p-3 last:border-0 dark:border-white/10"><input type="checkbox" checked={checked.includes(lead.id)} onChange={(e) => setChecked(e.target.checked ? [...checked, lead.id] : checked.filter((id) => id !== lead.id))}/><div className="min-w-0 flex-1"><p className="truncate font-bold">{lead.company || lead.name}</p><p className="truncate text-xs text-slate-500">{lead.email || lead.phone || lead.website}</p></div><ScoreBadge score={lead.score} label={lead.score_label}/></label>)}</div></div>

            <div className="mt-6"><h4 className="mb-3 font-black">Campaign leads</h4><div className="space-y-2">{selected.leads?.map((l) => <div key={l.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950"><div className="flex justify-between gap-3"><div><p className="font-bold">{l.company || l.name}</p><p className="text-xs text-slate-500">{l.email || l.phone} • {l.status}</p></div><ScoreBadge score={l.score} label={l.score_label}/></div>{l.personalized_message && <p className="mt-3 line-clamp-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600 dark:bg-white/5 dark:text-slate-300">{l.personalized_message}</p>}{l.error && <p className="mt-2 text-sm font-semibold text-red-500">{l.error}</p>}</div>)}</div></div>
          </>}
        </section>
      </div>
    </div>
  );
}
