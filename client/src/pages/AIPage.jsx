import { useEffect, useRef, useState } from 'react';
import { Bot, Send, Sparkles, Users, Zap, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../utils/api.js';

const SUGGESTIONS = [
  'Find 10 restaurants in Lagos that urgently need a website',
  'Find dental clinics in London ready to buy — create a campaign',
  'Write a cold email for my hottest lead',
  'Generate an MVP proposal for a food delivery app',
  'Score all my current leads and tell me who to contact first',
  'Find 20 tech startups in Dubai needing digital marketing',
];

function PipelineResult({ data }) {
  if (!data) return null;
  return (
    <div className="mt-3 rounded-2xl overflow-hidden" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
      <div className="px-4 py-3 flex items-center gap-2" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <CheckCircle2 size={14} color="#16A34A"/>
        <span className="text-xs font-bold" style={{ color: 'var(--text)' }}>Auto-pipeline completed</span>
      </div>
      <div className="p-4 space-y-3">
        {data.leadsFound > 0 && (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#EFF6FF' }}>
              <Users size={14} color="#2563EB"/>
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                {data.leadsFound} leads found
              </p>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                {data.hotLeads} Hot · {data.warmLeads} Warm · {data.coldLeads} Cold
              </p>
            </div>
          </div>
        )}
        {data.campaignName && (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#F0FDF4' }}>
              <CheckCircle2 size={14} color="#16A34A"/>
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                Campaign "{data.campaignName}" created
              </p>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                {data.emailsQueued ?? 0} emails queued · Connect Gmail to send
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Message({ role, content, provider, pipeline, isNew }) {
  const isUser = role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} ${isNew ? 'animate-fade-up' : ''}`}>
      {!isUser && (
        <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: 'var(--brand)', flexShrink: 0 }}>
          <Bot size={14} color="white"/>
        </div>
      )}
      <div className={`max-w-[85%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${isUser ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
          style={isUser
            ? { background: 'var(--brand)', color: 'white' }
            : { background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-2)' }
          }>
          <p className="whitespace-pre-wrap">{content}</p>
          {provider && !isUser && (
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>
              via {provider}
            </p>
          )}
        </div>
        {pipeline && <PipelineResult data={pipeline}/>}
      </div>
      {isUser && (
        <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold text-white"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-2)', flexShrink: 0 }}>
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
      content: "Hi! I'm FlowAI — your AI-powered lead engine.\n\nJust tell me what you need and I'll handle everything:\n\n• \"Find 10 restaurants in Lagos that need a website\" → I'll search, score, and create a campaign\n• \"Write outreach for my hottest lead\" → personalized email ready\n• \"Generate MVP proposal for a food delivery app\" → full proposal\n\nWhat would you like to do?",
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pipelineActive, setPipelineActive] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    api('/ai/providers/health').then(d => setProviders(d.providers)).catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const isPipelineCommand = (text) => {
    const lower = text.toLowerCase();
    return (lower.includes('find') || lower.includes('discover') || lower.includes('search') || lower.includes('get')) &&
      (lower.includes('lead') || lower.includes('client') || lower.includes('business') || lower.includes('restaurant') ||
       lower.includes('clinic') || lower.includes('shop') || lower.includes('company') || lower.includes('startup') ||
       lower.includes('agency') || lower.includes('store') || lower.includes('hotel') || lower.includes('firm'));
  };

  async function send(text) {
    const content = text || input.trim();
    if (!content) return;
    const next = [...messages, { role: 'user', content, isNew: true }];
    setMessages(next);
    setInput('');
    setLoading(true);
    inputRef.current?.focus();

    try {
      if (isPipelineCommand(content)) {
        setPipelineActive(true);
        const pipelineMsg = { role: 'assistant', content: '🔍 Searching for real businesses... Scoring leads... This takes 15-30 seconds.', isNew: true };
        setMessages([...next, pipelineMsg]);
        try {
          const data = await api('/ai/auto-pipeline', {
            method: 'POST',
            body: { command: content }
          });
          setMessages([...next, {
            role: 'assistant',
            content: data.message,
            provider: data.provider,
            pipeline: data.pipeline,
            isNew: true,
          }]);
        } catch (pErr) {
          const fallback = await api('/ai/chat', {
            method: 'POST',
            body: { messages: next.filter(m => m.role !== 'system').map(({ role, content }) => ({ role, content })) }
          });
          setMessages([...next, { role: 'assistant', content: fallback.message, provider: fallback.provider, isNew: true }]);
        }
        setPipelineActive(false);
      } else {
        const data = await api('/ai/chat', {
          method: 'POST',
          body: { messages: next.filter(m => m.role !== 'system').map(({ role, content }) => ({ role, content })) }
        });
        setMessages([...next, { role: 'assistant', content: data.message, provider: data.provider, isNew: true }]);
      }
    } catch (err) {
      setMessages([...next, { role: 'assistant', content: `Error: ${err.message}`, isNew: true }]);
    } finally {
      setLoading(false);
      setPipelineActive(false);
    }
  }

  const onKey = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };
  const activeProvider = providers.find(p => ['online','configured'].includes(p.status));

  return (
    <div className="flex flex-col" style={{ height: 'calc(100dvh - 140px)', maxHeight: 900 }}>

      {/* Header */}
      <div className="flex items-center justify-between pb-4 shrink-0">
        <div>
          <h1 className="text-xl font-black flex items-center gap-2" style={{ color: 'var(--text)', letterSpacing: '-0.02em' }}>
            <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--brand)' }}>
              <Bot size={16} color="white"/>
            </div>
            AI Assistant
          </h1>
          <p className="text-xs mt-0.5 ml-10" style={{ color: 'var(--text-3)' }}>
            Say "find leads" to trigger the full auto-pipeline
          </p>
        </div>
        {activeProvider ? (
          <div className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold"
            style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#15803d' }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#16A34A' }}/>
            {activeProvider.provider} · Live
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold"
            style={{ background: '#FFFBEB', border: '1px solid #FDE68A', color: '#b45309' }}>
            <AlertCircle size={12}/>
            Add Groq key in Settings
          </div>
        )}
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto rounded-2xl p-4 space-y-4 mb-3"
        style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>

        {messages.map((m, i) => (
          <Message key={i} {...m} isNew={m.isNew && i === messages.length - 1}/>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'var(--brand)', flexShrink: 0 }}>
              <Bot size={14} color="white"/>
            </div>
            <div className="rounded-2xl rounded-bl-sm px-4 py-3"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              {pipelineActive ? (
                <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-2)' }}>
                  <Zap size={12} color="var(--brand)" className="animate-pulse"/>
                  Searching leads, scoring, creating campaign…
                </div>
              ) : (
                <div className="flex gap-1.5 items-center h-5">
                  {[0,1,2].map(i => (
                    <div key={i} className="h-1.5 w-1.5 rounded-full"
                      style={{ background: 'var(--brand)', animation: `pulseDot 1.4s ease-in-out ${i * 0.2}s infinite` }}/>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Suggestions */}
      {messages.length === 1 && (
        <div className="shrink-0 mb-3">
          <p className="text-xs mb-2 px-1" style={{ color: 'var(--text-3)' }}>Try asking:</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {SUGGESTIONS.map(s => (
              <button key={s} onClick={() => send(s)}
                className="shrink-0 text-xs rounded-xl px-3 py-2 transition-all whitespace-nowrap"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-2)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand)'; e.currentTarget.style.color = 'var(--brand)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)'; }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="shrink-0">
        <div className="flex gap-2 rounded-2xl p-2"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
          <textarea
            ref={inputRef}
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm placeholder-[var(--text-3)] outline-none py-2 px-2 leading-relaxed"
            style={{ maxHeight: 120, color: 'var(--text)' }}
            placeholder="Ask FlowAI — find leads, write outreach, generate proposals…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKey}
          />
          <button
            disabled={loading || !input.trim()}
            onClick={() => send()}
            className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 self-end mb-0.5 transition-all disabled:opacity-30"
            style={{ background: 'var(--brand)', boxShadow: '0 1px 2px rgba(37,99,235,.3)' }}>
            <Send size={16} color="white"/>
          </button>
        </div>
        <p className="text-[10px] text-center mt-2" style={{ color: 'var(--text-3)' }}>
          Powered by Groq (Llama 3.1 · free) · Rule engine fallback · Auto-pipeline enabled
        </p>
      </div>

      {/* Provider status */}
      {providers.length > 0 && (
        <div className="shrink-0 mt-2 flex gap-2 overflow-x-auto">
          {providers.map(p => (
            <div key={p.provider} className="shrink-0 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-medium"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-3)' }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{
                background: ['online','configured'].includes(p.status) ? '#16A34A' : '#94A3B8'
              }}/>
              {p.provider}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
