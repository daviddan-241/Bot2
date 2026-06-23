import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Bot, ExternalLink, Mail, MessageCircle, RefreshCw, Send, Sparkles } from 'lucide-react';
import { api } from '../utils/api.js';
import ScoreBadge from '../components/ScoreBadge.jsx';

const TONES = ['friendly', 'professional', 'direct', 'warm', 'premium'];

export default function LeadDetailPage() {
  const { id } = useParams();
  const [lead, setLead] = useState(null);
  const [message, setMessage] = useState(null);
  const [tone, setTone] = useState('friendly');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [genLoading, setGenLoading] = useState(false);

  async function load() {
    try { const data = await api(`/leads/${id}`); setLead(data.lead); }
    catch (err) { setError(err.message); }
  }
  useEffect(() => { load(); }, [id]);

  async function generate(channel = 'email') {
    setGenLoading(true); setStatus(''); setError('');
    try {
      const result = await api('/ai/generate-message', { method: 'POST', body: { lead, tone, channel } });
      setMessage(result); setStatus(`Generated via ${result.provider}`);
    }
    catch (err) { setError(err.message); }
    finally { setGenLoading(false); }
  }

  async function rescore() {
    setStatus('Rescoring…');
    const data = await api(`/leads/${id}/score`, { method: 'POST' });
    setLead(data.lead); setStatus(`Scored by ${data.lead.scoring?.provider || 'engine'}`);
  }

  async function sendEmail() {
    if (!lead.email) return setError('No email on this lead.');
    const body = message?.message || (await api('/ai/generate-message', { method: 'POST', body: { lead, tone, channel: 'email' } })).message;
    const subject = message?.subject || `Quick idea for ${lead.company || lead.name}`;
    setStatus('Sending…');
    const result = await api('/email/send', { method: 'POST', body: { leadId: lead.id, subject, text: body } });
    setStatus(result.sent ? '✓ Email sent.' : `Email error: ${result.error}`);
  }

  async function sendWhatsapp() {
    if (!lead.phone && !lead.normalized_phone) return setError('No phone on this lead.');
    const body = message?.whatsappMessage || message?.message || (await api('/ai/generate-message', { method: 'POST', body: { lead, tone, channel: 'whatsapp' } })).whatsappMessage;
    setStatus('Sending WhatsApp…');
    const result = await api('/whatsapp/send', { method: 'POST', body: { leadId: lead.id, message: body } });
    setStatus(result.sent ? '✓ WhatsApp sent.' : `WhatsApp: ${result.status}`);
    if (result.waLink) window.open(result.waLink, '_blank');
  }

  if (error && !lead) return (
    <div className="card p-12 text-center space-y-4">
      <p className="text-red-400 font-semibold">{error}</p>
      <Link to="/leads" className="btn-secondary inline-flex">← Back to leads</Link>
    </div>
  );

  if (!lead) return <div className="card h-80 animate-pulse"/>;

  const analysis = typeof lead.analysis === 'object' ? lead.analysis : {};

  return (
    <div className="space-y-6 animate-fade-up">
      <Link to="/leads" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors">
        <ArrowLeft size={15}/> Back to leads
      </Link>

      <section className="card p-5 sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.2em] text-[#5c67ff]">Lead profile</p>
            <h2 className="mt-2 text-3xl font-black text-white">{lead.company || lead.name}</h2>
            <p className="mt-1 text-slate-400">{lead.name}{lead.title ? ` · ${lead.title}` : ''}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {lead.industry && <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300">{lead.industry}</span>}
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300 capitalize">{lead.source}</span>
              {lead.whatsapp_status && <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300">WA: {lead.whatsapp_status}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <ScoreBadge score={lead.score} label={lead.score_label}/>
            <button onClick={rescore} className="btn-secondary"><RefreshCw size={14}/> Rescore</button>
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
        <section className="card p-5 space-y-5">
          <h3 className="text-base font-black text-white">Contact & enrichment</h3>
          <dl className="space-y-4">
            {[
              { label: 'Email', value: lead.email, href: lead.email ? `mailto:${lead.email}` : null },
              { label: 'Phone', value: lead.phone },
              { label: 'Website', value: lead.website, href: lead.website },
              { label: 'Location', value: lead.location },
            ].map(({ label, value, href }) => (
              <div key={label}>
                <dt className="label">{label}</dt>
                <dd className="font-semibold text-slate-200 break-words">
                  {value ? (
                    href ? <a href={href} target="_blank" rel="noreferrer" className="hover:text-[#5c67ff] transition-colors inline-flex items-center gap-1">{value}<ExternalLink size={12}/></a> : value
                  ) : <span className="text-slate-600">—</span>}
                </dd>
              </div>
            ))}
          </dl>

          {lead.score_reasons?.length > 0 && (
            <div>
              <h4 className="mb-3 text-sm font-black text-white">Score breakdown</h4>
              <div className="space-y-2">
                {lead.score_reasons.map((r, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-white/[.03] border border-white/[.05] px-3 py-2.5 text-sm">
                    <span className="text-slate-300">{r.label}</span>
                    <span className={`font-bold ${r.points < 0 ? 'text-red-400' : 'text-emerald-400'}`}>{r.points > 0 ? '+' : ''}{r.points}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="card p-5 space-y-5">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(92,103,255,.15)', border: '1px solid rgba(92,103,255,.2)' }}>
              <Bot size={16} className="text-[#5c67ff]"/>
            </div>
            <h3 className="text-base font-black text-white">AI outreach panel</h3>
          </div>

          {analysis.summary && (
            <div className="rounded-xl border border-white/[.06] bg-white/[.02] p-4">
              <p className="text-sm text-slate-300 leading-6">{analysis.summary}</p>
              {analysis.keywords?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {analysis.keywords.map((k) => (
                    <span key={k} className="rounded-full bg-[rgba(92,103,255,.12)] px-2.5 py-0.5 text-xs font-semibold text-[#8b96ff]">{k}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-[160px_1fr_1fr]">
            <select className="input" value={tone} onChange={(e) => setTone(e.target.value)}>
              {TONES.map((t) => <option key={t}>{t}</option>)}
            </select>
            <button onClick={() => generate('email')} disabled={genLoading} className="btn-primary">
              {genLoading ? <RefreshCw size={14} className="animate-spin"/> : <Mail size={14}/>}
              Email copy
            </button>
            <button onClick={() => generate('whatsapp')} disabled={genLoading} className="btn-secondary">
              <MessageCircle size={14}/> WhatsApp
            </button>
          </div>

          {message && (
            <div className="space-y-3">
              {message.subject && (
                <input className="input font-semibold" value={message.subject} readOnly placeholder="Subject line"/>
              )}
              <textarea
                className="input min-h-[200px] resize-y text-sm leading-6"
                value={message.message || message.whatsappMessage || ''}
                onChange={(e) => setMessage({ ...message, message: e.target.value })}
              />
              <div className="flex flex-wrap gap-2">
                <button onClick={sendEmail} className="btn-primary"><Send size={14}/> Send email</button>
                <button onClick={sendWhatsapp} className="btn-secondary"><MessageCircle size={14}/> Send WhatsApp</button>
              </div>
            </div>
          )}

          {status && <p className="rounded-xl border border-[rgba(92,103,255,.2)] bg-[rgba(92,103,255,.1)] p-3 text-sm font-semibold text-[#8b96ff]">{status}</p>}
          {error && <p className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm font-semibold text-red-400">{error}</p>}
        </section>
      </div>
    </div>
  );
}
