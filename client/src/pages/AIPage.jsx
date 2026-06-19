import { useEffect, useRef, useState } from 'react';
import { Bot, Send } from 'lucide-react';
import { api } from '../utils/api.js';

export default function AIPage() {
  const [providers, setProviders] = useState([]);
  const [messages, setMessages] = useState([{ role: 'assistant', content: 'Hi — I can help score leads, write outreach, inspect campaigns, and plan legal lead discovery.' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottom = useRef(null);

  useEffect(() => { api('/ai/providers/health').then((d) => setProviders(d.providers)).catch(() => {}); }, []);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function send(e) {
    e.preventDefault(); if (!input.trim()) return;
    const next = [...messages, { role: 'user', content: input.trim() }];
    setMessages(next); setInput(''); setLoading(true);
    try { const data = await api('/ai/chat', { method: 'POST', body: { messages: next.filter((m) => m.role !== 'system') } }); setMessages([...next, { role: 'assistant', content: data.message, provider: data.provider }]); }
    catch (err) { setMessages([...next, { role: 'assistant', content: `Error: ${err.message}` }]); }
    finally { setLoading(false); }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      <aside className="glass-card p-5">
        <div className="flex items-center gap-2"><Bot className="text-blue-600"/><h2 className="text-xl font-black">AI Brain</h2></div>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Provider priority: Ollama → Groq → HuggingFace → deterministic rule engine.</p>
        <div className="mt-5 space-y-2">{providers.map((p) => <div key={p.provider} className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-950"><div className="flex items-center justify-between"><p className="font-bold">{p.provider}</p><span className={`h-2.5 w-2.5 rounded-full ${['online','configured'].includes(p.status) ? 'bg-emerald-500' : p.status === 'offline' ? 'bg-amber-500' : 'bg-slate-300'}`}/></div><p className="mt-1 text-xs text-slate-500">{p.status} • {p.model}</p></div>)}</div>
      </aside>

      <section className="glass-card flex h-[calc(100vh-150px)] min-h-[560px] flex-col overflow-hidden">
        <div className="border-b border-slate-200 p-4 dark:border-white/10"><h3 className="font-black">LeadFlow assistant</h3><p className="text-sm text-slate-500">Ask for prospecting queries, scoring explanation, or outreach copy.</p></div>
        <div className="flex-1 space-y-4 overflow-auto p-4">{messages.map((m, i) => <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] whitespace-pre-wrap rounded-3xl px-4 py-3 text-sm leading-7 ${m.role === 'user' ? 'bg-blue-600 text-white' : 'border border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-slate-950 dark:text-slate-200'}`}>{m.content}{m.provider && <p className="mt-2 text-[10px] font-bold uppercase opacity-60">{m.provider}</p>}</div></div>)}{loading && <div className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 dark:border-white/10 dark:bg-slate-950">Thinking…</div>}<div ref={bottom}/></div>
        <form onSubmit={send} className="border-t border-slate-200 p-3 dark:border-white/10"><div className="flex gap-2"><input className="input" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask LeadFlow AI…"/><button disabled={loading} className="btn-primary !px-4"><Send size={18}/></button></div></form>
      </section>
    </div>
  );
}
