import { useEffect, useState } from 'react';
import { CheckCircle2, ChevronDown, Mail, Megaphone, MessageCircle, Play, Plus, RefreshCw, Send, Trash2, Zap } from 'lucide-react';
import { api } from '../utils/api.js';
import ScoreBadge from '../components/ScoreBadge.jsx';

const STAT_META = [
  { key: 'sent',    label: 'Sent',    bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0' },
  { key: 'queued',  label: 'Queued',  bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' },
  { key: 'failed',  label: 'Failed',  bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' },
  { key: 'skipped', label: 'Skipped', bg: '#F8FAFC', color: '#94A3B8', border: '#E2E8F0' },
];

function StatCard({ label, value, bg, color, border }) {
  return (
    <div className="rounded-2xl p-4 text-center" style={{ background: bg, border: `1px solid ${border}` }}>
      <p className="text-2xl font-black" style={{ color }}>{value ?? 0}</p>
      <p className="text-[11px] font-semibold uppercase tracking-wide mt-0.5" style={{ color, opacity: 0.75 }}>{label}</p>
    </div>
  );
}

function ChannelBadge({ channel }) {
  const map = {
    email:     { icon: Mail,           label: 'Email',      color: '#2563EB', bg: '#EFF6FF' },
    whatsapp:  { icon: MessageCircle,  label: 'WhatsApp',   color: '#16A34A', bg: '#F0FDF4' },
    multi:     { icon: Zap,            label: 'Multi',      color: '#7C3AED', bg: '#F5F3FF' },
  };
  const m = map[channel] || map.email;
  const Icon = m.icon;
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
      style={{ background: m.bg, color: m.color }}>
      <Icon size={9}/>{m.label}
    </span>
  );
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [selected, setSelected]   = useState(null);
  const [leads, setLeads]         = useState([]);
  const [checked, setChecked]     = useState([]);
  const [form, setForm]           = useState({ name: '', channel: 'email', tone: 'friendly', subject: '', template: 'Hi {{firstName}},\n\n{{aiMessage}}\n\nBest,' });
  const [status, setStatus]       = useState('');
  const [error, setError]         = useState('');
  const [running, setRunning]     = useState(false);
  const [tab, setTab]             = useState('list');
  const [creating, setCreating]   = useState(false);

  async function load() {
    const [c, l] = await Promise.all([api('/campaigns'), api('/leads?limit=200')]);
    setCampaigns(c.campaigns); setLeads(l.rows);
    if (selected) setSelected((await api(`/campaigns/${selected.id}`)).campaign);
  }
  useEffect(() => { load().catch(err => setError(err.message)); }, []);

  async function create(e) {
    e.preventDefault(); setError('');
    try {
      const data = await api('/campaigns', { method: 'POST', body: form });
      setSelected(data.campaign);
      setCampaigns([data.campaign, ...campaigns]);
      setForm({ ...form, name: '' });
      setCreating(false);
      setTab('manage');
    } catch (err) { setError(err.message); }
  }

  async function addLeads() {
    if (!selected || !checked.length) return;
    const data = await api(`/campaigns/${selected.id}/leads`, { method: 'POST', body: { leadIds: checked } });
    setSelected(data.campaign); setChecked([]);
    setStatus(`${data.added} lead${data.added !== 1 ? 's' : ''} added.`);
    setTimeout(() => setStatus(''), 3000);
  }

  async function run() {
    if (!selected) return;
    setRunning(true); setStatus('Starting campaign — sending real emails…');
    try {
      const data = await api(`/campaigns/${selected.id}/run`, { method: 'POST', body: { delayMs: 2500, tone: selected.tone } });
      setSelected(data.campaign); setStatus(data.message);
      setTimeout(load, 3000);
    } catch (err) { setError(err.message); }
    finally { setRunning(false); }
  }

  async function selectCampaign(c) {
    const data = await api(`/campaigns/${c.id}`);
    setSelected(data.campaign);
    setTab('manage');
  }

  const sentTotal = campaigns.reduce((a, c) => a + (c.stats?.sent || 0), 0);

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.2em] mb-1" style={{ color: 'var(--brand)' }}>Outreach</p>
          <h1 className="text-2xl font-black" style={{ color: 'var(--text)', letterSpacing: '-0.02em' }}>Campaigns</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-2)' }}>
            AI-personalized email &amp; WhatsApp outreach — {sentTotal > 0 ? `${sentTotal} sent so far` : 'real sends, zero cost'}
          </p>
        </div>
        <button onClick={() => setCreating(true)}
          className="btn-primary shrink-0 flex items-center gap-1.5">
          <Plus size={14}/> New
        </button>
      </div>

      {/* Feedback */}
      {error  && (
        <div className="rounded-2xl px-4 py-3 text-sm font-medium flex items-center gap-2"
          style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}>
          <span className="shrink-0">⚠️</span> {error}
          <button className="ml-auto text-xs opacity-60" onClick={() => setError('')}>✕</button>
        </div>
      )}
      {status && (
        <div className="rounded-2xl px-4 py-3 text-sm font-medium flex items-center gap-2"
          style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: 'var(--brand)' }}>
          <CheckCircle2 size={14} className="shrink-0"/> {status}
        </div>
      )}

      {/* Create campaign modal/inline */}
      {creating && (
        <div className="rounded-2xl p-5 space-y-4" style={{ background: 'var(--surface)', border: '2px solid var(--brand)', boxShadow: '0 4px 24px rgba(37,99,235,.12)' }}>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold" style={{ color: 'var(--text)' }}>New campaign</h3>
            <button className="btn-ghost h-8 w-8 rounded-xl" onClick={() => setCreating(false)}>✕</button>
          </div>
          <form onSubmit={create} className="space-y-3">
            <input className="input" placeholder="Campaign name *" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} required/>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label mb-1 block">Channel</label>
                <select className="input" value={form.channel} onChange={e => setForm({ ...form, channel: e.target.value })}>
                  <option value="email">Email</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="multi">Multi-channel</option>
                </select>
              </div>
              <div>
                <label className="label mb-1 block">Tone</label>
                <select className="input" value={form.tone} onChange={e => setForm({ ...form, tone: e.target.value })}>
                  {['friendly','professional','direct','warm'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            {(form.channel === 'email' || form.channel === 'multi') && (
              <input className="input" placeholder="Email subject line" value={form.subject}
                onChange={e => setForm({ ...form, subject: e.target.value })}/>
            )}
            <div>
              <label className="label mb-1 block">Message template</label>
              <textarea className="input resize-none text-sm" rows={4} value={form.template}
                onChange={e => setForm({ ...form, template: e.target.value })}/>
              <p className="text-[11px] mt-1" style={{ color: 'var(--text-3)' }}>
                Use <code className="font-mono">{'{{firstName}}'}</code>, <code className="font-mono">{'{{company}}'}</code>, <code className="font-mono">{'{{aiMessage}}'}</code> — AI fills them in for each lead.
              </p>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" className="btn-primary flex-1">Create campaign</button>
              <button type="button" className="btn-secondary" onClick={() => setCreating(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl" style={{ background: 'var(--surface-2)' }}>
        {[
          { id: 'list',   label: `Campaigns (${campaigns.length})` },
          { id: 'manage', label: selected ? selected.name : 'Manage' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all truncate"
            style={tab === t.id
              ? { background: 'var(--surface)', color: 'var(--brand)', boxShadow: '0 1px 3px rgba(0,0,0,.08)' }
              : { color: 'var(--text-3)' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Campaign list */}
      {tab === 'list' && (
        <div className="space-y-3">
          {campaigns.length === 0 ? (
            <div className="rounded-2xl p-10 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="text-4xl mb-3">📧</div>
              <p className="font-bold text-base mb-1" style={{ color: 'var(--text)' }}>No campaigns yet</p>
              <p className="text-sm mb-4" style={{ color: 'var(--text-2)' }}>Create your first campaign to start sending real outreach</p>
              <button className="btn-primary mx-auto" onClick={() => setCreating(true)}><Plus size={14}/> New campaign</button>
            </div>
          ) : campaigns.map(c => (
            <button key={c.id} onClick={() => selectCampaign(c)}
              className="w-full rounded-2xl p-4 text-left transition-all hover:shadow-sm"
              style={{
                background: selected?.id === c.id ? 'var(--brand-light)' : 'var(--surface)',
                border: `1px solid ${selected?.id === c.id ? 'var(--brand)' : 'var(--border)'}`,
              }}>
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: selected?.id === c.id ? '#DBEAFE' : 'var(--surface-2)' }}>
                  <Megaphone size={16} style={{ color: selected?.id === c.id ? 'var(--brand)' : 'var(--text-3)' }}/>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>{c.name}</p>
                    <ChannelBadge channel={c.channel}/>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize"
                      style={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}>{c.status}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-3)' }}>
                    <span className="font-semibold" style={{ color: '#16A34A' }}>✓ {c.stats?.sent || 0} sent</span>
                    <span>{c.stats?.queued || 0} queued</span>
                    {c.stats?.failed > 0 && <span style={{ color: '#DC2626' }}>{c.stats.failed} failed</span>}
                    <span>{(c.leads?.length || 0)} leads</span>
                  </div>
                </div>
                <ChevronDown size={16} style={{ color: 'var(--text-3)', transform: selected?.id === c.id ? 'rotate(180deg)' : '', transition: 'transform 0.2s' }}/>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Manage campaign */}
      {tab === 'manage' && (
        !selected ? (
          <div className="rounded-2xl p-10 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="text-4xl mb-3">👆</div>
            <p className="font-bold" style={{ color: 'var(--text)' }}>Select a campaign first</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>Go to Campaigns tab and tap one</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Campaign header + run */}
            <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="flex items-start gap-3 mb-4">
                <div className="h-12 w-12 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: 'var(--brand-light)', border: '1px solid rgba(37,99,235,.2)' }}>
                  <Megaphone size={20} style={{ color: 'var(--brand)' }}/>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-black" style={{ color: 'var(--text)' }}>{selected.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <ChannelBadge channel={selected.channel}/>
                    <span className="text-xs capitalize" style={{ color: 'var(--text-3)' }}>{selected.tone} tone · {selected.status}</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {STAT_META.map(s => (
                  <StatCard key={s.key} {...s} value={selected.stats?.[s.key]}/>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={run} disabled={running || !selected.leads?.length}
                  className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {running ? <RefreshCw size={14} className="animate-spin"/> : <Play size={14}/>}
                  {running ? 'Sending…' : `Run campaign${selected.leads?.length ? ` (${selected.leads.length} leads)` : ''}`}
                </button>
                <button onClick={load} className="btn-secondary h-11 w-11 rounded-xl flex items-center justify-center">
                  <RefreshCw size={15}/>
                </button>
              </div>
              {!selected.leads?.length && (
                <p className="text-xs mt-2 text-center" style={{ color: 'var(--text-3)' }}>Add leads below to enable sending</p>
              )}
            </div>

            {/* Add leads */}
            <div className="rounded-2xl p-5 space-y-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold" style={{ color: 'var(--text)' }}>Add leads to campaign</h4>
                <button onClick={addLeads} disabled={!checked.length}
                  className="btn-primary text-xs h-8 px-3 flex items-center gap-1.5 disabled:opacity-40">
                  <Send size={11}/> Add {checked.length > 0 ? `(${checked.length})` : ''}
                </button>
              </div>
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', maxHeight: 280, overflowY: 'auto' }}>
                {leads.length === 0 ? (
                  <div className="p-6 text-center text-sm" style={{ color: 'var(--text-3)' }}>No leads found — use Discover or AI to add some</div>
                ) : leads.map(lead => (
                  <label key={lead.id} className="flex cursor-pointer items-center gap-3 p-3 transition-colors"
                    style={{ borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <input type="checkbox"
                      checked={checked.includes(lead.id)}
                      onChange={e => setChecked(e.target.checked ? [...checked, lead.id] : checked.filter(id => id !== lead.id))}
                      className="accent-[#2563EB] h-4 w-4 shrink-0"/>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold" style={{ color: 'var(--text)' }}>{lead.company || lead.name}</p>
                      <p className="truncate text-xs" style={{ color: 'var(--text-3)' }}>{lead.email || lead.phone || lead.website}</p>
                    </div>
                    <ScoreBadge score={lead.score} label={lead.score_label}/>
                  </label>
                ))}
              </div>
            </div>

            {/* Campaign leads with messages */}
            {selected.leads?.length > 0 && (
              <div className="rounded-2xl p-5 space-y-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <h4 className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                  Campaign leads ({selected.leads.length})
                </h4>
                <div className="space-y-2" style={{ maxHeight: 400, overflowY: 'auto' }}>
                  {selected.leads.map(l => {
                    const statusColor = l.status === 'sent' ? '#16A34A' : l.status === 'failed' ? '#DC2626' : 'var(--text-3)';
                    return (
                      <div key={l.id} className="rounded-2xl p-4"
                        style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{l.company || l.name}</p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                              {l.email || l.phone}
                              <span className="ml-2 font-semibold capitalize" style={{ color: statusColor }}>
                                {l.status === 'sent' ? '✓ sent' : l.status === 'failed' ? '✗ failed' : l.status}
                              </span>
                            </p>
                          </div>
                          <ScoreBadge score={l.score} label={l.score_label}/>
                        </div>
                        {l.personalized_message && (
                          <p className="text-xs leading-5 rounded-xl p-3 line-clamp-3"
                            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-2)' }}>
                            {l.personalized_message}
                          </p>
                        )}
                        {l.error && (
                          <p className="text-xs mt-1 font-medium" style={{ color: '#DC2626' }}>{l.error}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}
