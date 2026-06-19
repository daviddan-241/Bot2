import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Bot, Mail, MessageCircle, RefreshCw, Send } from 'lucide-react';
import { api } from '../utils/api.js';
import ScoreBadge from '../components/ScoreBadge.jsx';
import EmptyState from '../components/EmptyState.jsx';

export default function LeadDetailPage() {
  const { id } = useParams();
  const [lead, setLead] = useState(null);
  const [message, setMessage] = useState(null);
  const [tone, setTone] = useState('friendly');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  async function load() { try { const data = await api(`/leads/${id}`); setLead(data.lead); } catch (err) { setError(err.message); } }
  useEffect(() => { load(); }, [id]);

  async function generate(channel = 'email') {
    setStatus('Generating AI message…'); setError('');
    try { const result = await api('/ai/generate-message', { method: 'POST', body: { lead, tone, channel } }); setMessage(result); setStatus(`Generated with ${result.provider}`); }
    catch (err) { setError(err.message); }
  }
  async function rescore() { setStatus('Scoring…'); const data = await api(`/leads/${id}/score`, { method: 'POST' }); setLead(data.lead); setStatus(`Lead rescored by ${data.lead.scoring?.provider || 'engine'}`); }
  async function sendEmail() {
    if (!lead.email) return setError('Lead has no email.');
    const body = message?.message || (await api('/ai/generate-message', { method: 'POST', body: { lead, tone, channel: 'email' } })).message;
    const subject = message?.subject || `Quick idea for ${lead.company || lead.name}`;
    setStatus('Sending email…'); const result = await api('/email/send', { method: 'POST', body: { leadId: lead.id, subject, text: body } }); setStatus(result.sent ? 'Email sent.' : `Email not sent: ${result.error}`);
  }
  async function sendWhatsapp() {
    if (!lead.phone && !lead.normalized_phone) return setError('Lead has no phone.');
    const body = message?.whatsappMessage || message?.message || (await api('/ai/generate-message', { method: 'POST', body: { lead, tone, channel: 'whatsapp' } })).whatsappMessage;
    setStatus('Sending WhatsApp / generating link…'); const result = await api('/whatsapp/send', { method: 'POST', body: { leadId: lead.id, message: body } }); setStatus(result.sent ? 'WhatsApp sent.' : `WhatsApp ${result.status}.`); if (result.waLink) window.open(result.waLink, '_blank');
  }

  if (error && !lead) return <EmptyState title="Lead unavailable" text={error} action={<Link to="/leads" className="btn-secondary">Back to leads</Link>} />;
  if (!lead) return <div className="glass-card h-96 animate-pulse" />;
  const analysis = typeof lead.analysis === 'object' ? lead.analysis : {};

  return (
    <div className="space-y-5">
      <Link to="/leads" className="inline-flex items-center gap-2 text-sm font-bold text-blue-600"><ArrowLeft size={16}/> Back to leads</Link>
      <section className="glass-card p-5 sm:p-7">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div>
            <p className="text-sm font-bold uppercase tracking-[.2em] text-blue-600">Lead profile</p>
            <h2 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">{lead.company || lead.name}</h2>
            <p className="mt-2 text-slate-500 dark:text-slate-400">{lead.name} {lead.title ? `• ${lead.title}` : ''}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-sm"><span className="rounded-full bg-slate-100 px-3 py-1 font-bold dark:bg-white/10">{lead.industry || 'Unknown industry'}</span><span className="rounded-full bg-slate-100 px-3 py-1 font-bold dark:bg-white/10">WhatsApp: {lead.whatsapp_status}</span><span className="rounded-full bg-slate-100 px-3 py-1 font-bold capitalize dark:bg-white/10">{lead.source}</span></div>
          </div>
          <div className="flex flex-wrap gap-2"><ScoreBadge score={lead.score} label={lead.score_label}/><button onClick={rescore} className="btn-secondary"><RefreshCw size={16}/> Rescore</button></div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[.85fr_1.15fr]">
        <section className="glass-card p-5">
          <h3 className="text-lg font-black">Contact & enrichment</h3>
          <dl className="mt-4 space-y-4 text-sm">
            {['email','phone','website','location'].map((k) => <div key={k}><dt className="label">{k}</dt><dd className="break-words font-semibold text-slate-800 dark:text-slate-200">{lead[k] || '—'}</dd></div>)}
          </dl>
          <div className="mt-6"><h4 className="mb-3 font-black">Score reasons</h4><div className="space-y-2">{lead.score_reasons?.length ? lead.score_reasons.map((r, i) => <div key={i} className="flex justify-between rounded-2xl bg-slate-50 p-3 text-sm dark:bg-white/5"><span>{r.label}</span><span className={r.points < 0 ? 'text-red-500' : 'text-emerald-500'}>{r.points > 0 ? '+' : ''}{r.points}</span></div>) : <p className="text-sm text-slate-500">No breakdown yet.</p>}</div></div>
        </section>

        <section className="glass-card p-5">
          <div className="flex items-center gap-2"><Bot className="text-blue-600"/><h3 className="text-lg font-black">AI analysis panel</h3></div>
          <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950"><p className="text-sm leading-7 text-slate-600 dark:text-slate-300">{analysis.summary || 'No analysis summary stored yet. Use rescore or edit lead details to enrich.'}</p><div className="mt-3 flex flex-wrap gap-2">{analysis.keywords?.map((k) => <span key={k} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">{k}</span>)}</div></div>
          <div className="mt-5 grid gap-3 sm:grid-cols-[160px_1fr_1fr]"><select className="input" value={tone} onChange={(e) => setTone(e.target.value)}><option>friendly</option><option>professional</option><option>direct</option><option>warm</option><option>premium</option></select><button onClick={() => generate('email')} className="btn-primary"><Mail size={16}/> Generate email</button><button onClick={() => generate('whatsapp')} className="btn-secondary"><MessageCircle size={16}/> Generate WhatsApp</button></div>
          {message && <div className="mt-5 space-y-3"><input className="input font-semibold" value={message.subject || ''} readOnly/><textarea className="input min-h-[220px]" value={message.message || message.whatsappMessage || ''} onChange={(e) => setMessage({ ...message, message: e.target.value })}/><div className="flex flex-wrap gap-2"><button onClick={sendEmail} className="btn-primary"><Send size={16}/> Send email</button><button onClick={sendWhatsapp} className="btn-secondary"><MessageCircle size={16}/> Send WhatsApp</button></div></div>}
          {status && <p className="mt-4 rounded-2xl bg-blue-50 p-3 text-sm font-bold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">{status}</p>}
          {error && <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700 dark:bg-red-500/10 dark:text-red-300">{error}</p>}
        </section>
      </div>
    </div>
  );
}
