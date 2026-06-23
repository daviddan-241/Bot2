import { useEffect, useRef, useState } from 'react';
import { Bot, Send, Sparkles, Zap } from 'lucide-react';
import { api } from '../utils/api.js';

const SUGGESTIONS = [
  'Find dental clinics in Austin, TX and score them',
  'Write a friendly outreach email for a hot lead',
  'Generate an MVP proposal for a food delivery app',
  'Explain the lead scoring criteria',
  'Find 10 marketing agencies in London',
];

function ProviderDot({ status }) {
  const color = status === 'online' || status === 'configured'
    ? '#34d399' : status === 'offline' ? '#fbbf24' : '#475569';
  return <span className="h-2 w-2 rounded-full shrink-0" style={{ background: color }}/>;
}

function Message({ role, content, provider, isNew }) {
  const isUser = role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} ${isNew ? 'animate-fade-up' : ''}`}>
      {!isUser && (
        <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: 'linear-gradient(135deg,#5c67ff,#7c3aed)' }}>
          <Bot size={13} color="white"/>
        </div>
      )}
      <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${isUser ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
        style={isUser
          ? { background: 'rgba(92,103,255,.2)', border: '1px solid rgba(92,103,255,.3)', color: '#e0e5ff' }
          : { background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', color: '#cbd5e1' }}>
        <p className="whitespace-pre-wrap">{content}</p>
        {provider && (
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider opacity-50" style={{ color: '#a5b0ff' }}>
            {provider}
          </p>
        )}
      </div>
      {isUser && (
        <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold text-white"
          style={{ background: 'rgba(255,255,255,.1)' }}>
          Me
        </div>
      )}
    </div>
  );
}

export default function AIPage() {
  const [providers, setProviders] = useState([]);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm FlowAI's AI assistant powered by Groq (Llama 3.1). I can help you:\n\n• Find and score leads worldwide\n• Write personalized outreach copy\n• Generate MVP project proposals\n• Analyze businesses and contacts\n\nWhat would you like to do?",
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    api('/ai/providers/health').then(d => setProviders(d.providers)).catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function send(text) {
    const content = text || input.trim();
    if (!content) return;
    const next = [...messages, { role: 'user', content, isNew: true }];
    setMessages(next);
    setInput('');
    setLoading(true);
    inputRef.current?.focus();
    try {
      const data = await api('/ai/chat', {
        method: 'POST',
        body: { messages: next.filter(m => m.role !== 'system').map(({ role, content }) => ({ role, content })) }
      });
      setMessages([...next, { role: 'assistant', content: data.message, provider: data.provider, isNew: true }]);
    } catch (err) {
      setMessages([...next, { role: 'assistant', content: `Error: ${err.message}`, isNew: true }]);
    } finally {
      setLoading(false);
    }
  }

  const onKey = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };

  const activeProvider = providers.find(p => ['online','configured'].includes(p.status));

  return (
    <div className="flex flex-col h-[calc(100dvh-5rem)] lg:h-[calc(100dvh-4rem)] max-h-[900px]">

      {/* Header */}
      <div className="flex items-center justify-between px-1 pb-4 shrink-0">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-0.5">Workspace</p>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Bot size={20} color="#a5b0ff"/> AI Assistant
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {activeProvider ? (
            <div className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium"
              style={{ background: 'rgba(52,211,153,.1)', border: '1px solid rgba(52,211,153,.2)', color: '#34d399' }}>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"/>
              {activeProvider.provider} · Live
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium"
              style={{ background: 'rgba(251,191,36,.1)', border: '1px solid rgba(251,191,36,.2)', color: '#fbbf24' }}>
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400"/>
              Configure AI in Settings
            </div>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto scrollable rounded-2xl p-4 space-y-4"
        style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.06)' }}>

        {messages.map((m, i) => (
          <Message key={i} {...m} isNew={m.isNew && i === messages.length - 1}/>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg,#5c67ff,#7c3aed)' }}>
              <Bot size={13} color="white"/>
            </div>
            <div className="rounded-2xl rounded-bl-sm px-4 py-3"
              style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)' }}>
              <div className="flex gap-1.5 items-center h-5">
                {[0,1,2].map(i => (
                  <div key={i} className="h-1.5 w-1.5 rounded-full"
                    style={{ background: '#5c67ff', animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite` }}/>
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Suggestions (only when first message) */}
      {messages.length === 1 && (
        <div className="shrink-0 mt-3">
          <p className="text-xs text-slate-500 mb-2 px-1">Try asking:</p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollable">
            {SUGGESTIONS.map(s => (
              <button key={s} onClick={() => send(s)}
                className="shrink-0 text-xs rounded-xl px-3 py-2 text-slate-300 hover:text-white transition-all whitespace-nowrap"
                style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)' }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="shrink-0 mt-3">
        <div className="flex gap-2 rounded-2xl p-2"
          style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)' }}>
          <textarea
            ref={inputRef}
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm text-white placeholder-slate-500 outline-none py-2 px-2 leading-relaxed"
            style={{ maxHeight: 120 }}
            placeholder="Ask FlowAI anything — find leads, write outreach, generate proposals…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKey}
          />
          <button
            disabled={loading || !input.trim()}
            onClick={() => send()}
            className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 self-end mb-0.5 transition-all disabled:opacity-30"
            style={{ background: 'linear-gradient(135deg,#5c67ff,#7c3aed)', boxShadow: '0 2px 8px rgba(92,103,255,.3)' }}>
            <Send size={15} color="white"/>
          </button>
        </div>
        <p className="text-[10px] text-slate-600 text-center mt-2">
          Powered by Groq (Llama 3.1) · HuggingFace fallback · Local Ollama support
        </p>
      </div>

      {/* Provider status bar */}
      {providers.length > 0 && (
        <div className="shrink-0 mt-2 flex gap-2 overflow-x-auto scrollable">
          {providers.map(p => (
            <div key={p.provider} className="shrink-0 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-medium"
              style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)', color: '#64748b' }}>
              <ProviderDot status={p.status}/>
              <span className="text-slate-400">{p.provider}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
