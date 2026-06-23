import { useEffect, useState } from 'react';
import { Megaphone, Play, Plus, RefreshCw, Send } from 'lucide-react';
import { api } from '../utils/api.js';
import ScoreBadge from '../components/ScoreBadge.jsx';

const STAT_KEYS = ['queued','sent','failed','skipped'];
const STAT_COLORS = {
  queued:  'text-amber-400',
  sent:    'text-emerald-400',
  failed:  'text-red-400',
  skipped: 'text-slate-400',
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [selected, setSelected] = useState(null);
  const [leads, setLeads] = useState([]);
  const [checked, setChecked] = useState([]);
  const [form, setForm] = useState({ name: '', channel: 'email', tone: 'friendly', subject: '', template: 'Hi {{firstName}},\n\n{{aiMessage}}\n\nBest,' });
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [running, setRunning] = useState(false);

  async function load() {
    const [c, l] = await Promise.all([api('/campaigns'), api('/leads?limit=200')]);
    setCampaigns(c.campaigns); setLeads(l.rows);
    if (selected) setSelected((await api(`/campaigns/${selected.id}`)).campaign);
  }
  useEffect(() => { load().catch((err) => setError(err.message)); }, []);

  async function create(e) {
    e.preventDefault(); setError('');
    try {
      const data = await api('/campaigns', { method: 'POST', body: form });
      setSelected(data.campaign); setCampaigns([data.campaign, ...campaigns]);
      setForm({ ...form, name: '' });
    }
    catch (err) { setError(err.message); }
  }

  async function addLeads() {
    if (!selected || !checked.length) return;
    const data = await api(`/campaigns/${selected.id}/leads`, { method: 'POST', body: { leadIds: checked } });
    setSelected(data.campaign); setChecked([]); setStatus(`${data.added} leads added to campaign.`);
  }

  async function run() {
    if (!selected) return;
    setRunning(true); setStatus('Starting campaign…');
    try {
      const data = await api(`/campaigns/${selected.id}/run`, { method: 'POST', body: { delayMs: 2500, tone: selected.tone } });
      setSelected(data.campaign); setStatus(data.message);
      setTimeout(load, 2500);
    }
    catch (err) { setError(err.message); }
    finally { setRunning(false); }
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <p className="text-xs font-bold uppercase tracking-[.2em] text-[#5c67ff]">Outreach Automation</p>
        <h2 className="mt-2 text-3xl font-black text-white">Campaigns</h2>
        <p className="mt-1 max-w-xl text-sm text-slate-400 leading-6">Create campaigns, add leads, generate AI-personalized messages, and send via Gmail SMTP or WhatsApp Cloud API.</p>
      </div>

      {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-semibold text-red-400">{error}</div>}
      {status && <div className="rounded-xl border border-[rgba(92,103,255,.2)] bg-[rgba(92,103,255,.08)] p-4 text-sm font-semibold text-[#8b96ff]">{status}</div>}

      <div className="grid gap-5 xl:grid-cols-[340px_1fr]">
        <div className="space-y-4">
          <form onSubmit={create} className="card p-5 space-y-3">
            <h3 className="flex items-center gap-2 text-base font-black text-white"><Plus size={16}/> New campaign</h3>
            <input className="input" placeholder="Campaign name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required/>
            <div className="grid grid-cols-2 gap-3">
              <select className="input" value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}>
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="multi">Multi-channel</option>
              </select>
              <select className="input" value={form.tone} onChange={(e) => setForm({ ...form, tone: e.target.value })}>
                {['friendly','professional','direct','warm'].map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <input className="input" placeholder="Subject (email)" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}/>
            <textarea className="input min-h-[100px] resize-none text-sm" value={form.template} onChange={(e) => setForm({ ...form, template: e.target.value })}/>
            <button className="btn-primary w-full">Create campaign</button>
          </form>

          <div className="card p-5 space-y-3">
            <h3 className="text-base font-black text-white">Campaigns</h3>
            {campaigns.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">No campaigns yet.</p>
            ) : campaigns.map((c) => (
              <button key={c.id}
                onClick={async () => setSelected((await api(`/campaigns/${c.id}`)).campaign)}
                className={`w-full rounded-xl border p-4 text-left transition-all ${selected?.id === c.id
                  ? 'border-[rgba(92,103,255,.4)] bg-[rgba(92,103,255,.1)]'
                  : 'border-white/[.06] bg-white/[.02] hover:border-[rgba(92,103,255,.25)]'
                }`}>
                <p className="font-bold text-white">{c.name}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs text-slate-400 capitalize">{c.channel}</span>
                  <span className="text-xs text-slate-600">·</span>
                  <span className="text-xs text-slate-400 capitalize">{c.status}</span>
                  <span className="text-xs text-slate-600">·</span>
                  <span className="text-xs text-emerald-400">{c.stats?.sent || 0} sent</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <section className="card p-5 sm:p-6">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4 text-center">
              <div className="h-14 w-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(92,103,255,.12)', border: '1px solid rgba(92,103,255,.2)' }}>
                <Megaphone size={24} className="text-[#5c67ff]"/>
              </div>
              <div>
                <p className="font-black text-white">Select a campaign</p>
                <p className="mt-1 text-sm text-slate-400">Create or pick a campaign to manage leads and run outreach.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-xl font-black text-white">{selected.name}</h3>
                  <p className="mt-0.5 text-sm text-slate-400 capitalize">{selected.channel} · {selected.status} · {selected.tone}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={load} className="btn-secondary"><RefreshCw size={14}/> Refresh</button>
                  <button onClick={run} disabled={running} className="btn-primary">
                    {running ? <RefreshCw size={14} className="animate-spin"/> : <Play size={14}/>}
                    Run
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                {STAT_KEYS.map((k) => (
                  <div key={k} className="rounded-xl border border-white/[.06] bg-white/[.02] p-4 text-center">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{k}</p>
                    <p className={`text-2xl font-black mt-1 ${STAT_COLORS[k]}`}>{selected.stats?.[k] || 0}</p>
                  </div>
                ))}
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-black text-white">Add leads to campaign</h4>
                  <button onClick={addLeads} disabled={!checked.length} className="btn-secondary text-xs">
                    <Send size={12}/> Add {checked.length > 0 ? `(${checked.length})` : ''}
                  </button>
                </div>
                <div className="max-h-56 overflow-auto rounded-xl border border-white/[.06]">
                  {leads.map((lead) => (
                    <label key={lead.id} className="flex cursor-pointer items-center gap-3 border-b border-white/[.04] p-3 last:border-0 hover:bg-white/[.02] transition-colors">
                      <input type="checkbox"
                        checked={checked.includes(lead.id)}
                        onChange={(e) => setChecked(e.target.checked ? [...checked, lead.id] : checked.filter((id) => id !== lead.id))}
                        className="accent-[#5c67ff]"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">{lead.company || lead.name}</p>
                        <p className="truncate text-xs text-slate-500">{lead.email || lead.phone || lead.website}</p>
                      </div>
                      <ScoreBadge score={lead.score} label={lead.score_label}/>
                    </label>
                  ))}
                </div>
              </div>

              {selected.leads?.length > 0 && (
                <div>
                  <h4 className="mb-3 text-sm font-black text-white">Campaign leads ({selected.leads.length})</h4>
                  <div className="space-y-2 max-h-80 overflow-auto">
                    {selected.leads.map((l) => (
                      <div key={l.id} className="rounded-xl border border-white/[.06] bg-white/[.02] p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-white">{l.company || l.name}</p>
                            <p className="text-xs text-slate-400">{l.email || l.phone} · <span className="capitalize">{l.status}</span></p>
                          </div>
                          <ScoreBadge score={l.score} label={l.score_label}/>
                        </div>
                        {l.personalized_message && (
                          <p className="mt-3 rounded-lg bg-white/[.03] p-3 text-sm text-slate-300 leading-5 line-clamp-3">{l.personalized_message}</p>
                        )}
                        {l.error && <p className="mt-2 text-xs font-semibold text-red-400">{l.error}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
