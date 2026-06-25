import { useEffect, useRef, useState, useCallback } from 'react';
import { Bot, Send, Sparkles, Users, Zap, CheckCircle2, AlertCircle, Settings2, ChevronDown, ChevronUp, Mail, RefreshCw, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api.js';

const PIPELINE_STEPS = [
  { id: 'search',    label: '🔍 Searching real businesses…',        ms: 0    },
  { id: 'score',     label: '🎯 AI-scoring every lead…',            ms: 5000 },
  { id: 'campaign',  label: '📧 Creating campaign…',               ms: 10000 },
  { id: 'proposals', label: '📝 Generating proposals…',            ms: 15000 },
  { id: 'email',     label: '✉️  Queueing outreach emails…',       ms: 20000 },
  { id: 'done',      label: '✅ Pipeline complete!',               ms: 25000 },
];

const DEFAULT_SUGGESTIONS = [
  'Find 10 restaurants in California — create campaigns and generate proposals for all',
  'Find 15 dental clinics in London needing a website, email them all',
  'Find urgent leads in Dubai, generate proposal for each and send',
  'Find angel investors and VCs in Silicon Valley for my SaaS startup pitch',
  'Find recently funded startups in London that need marketing services',
  'Check for replies and follow up with anyone who hasn\'t responded',
  'Score all my current leads and tell me who to contact first',
];

function PipelineResult({ data }) {
  if (!data) return null;
  return (
    <div className="mt-3 rounded-2xl overflow-hidden" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
      <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <CheckCircle2 size={13} color="#16A34A"/>
        <span className="text-xs font-bold" style={{ color: 'var(--text)' }}>Auto-pipeline completed</span>
      </div>
      <div className="p-4 space-y-3">
        {data.leadsFound > 0 && (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#EFF6FF' }}>
              <Users size={14} color="#2563EB"/>
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{data.leadsFound} leads found & saved</p>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                🔥 {data.hotLeads} Hot · 🌡️ {data.warmLeads} Warm · ❄️ {data.coldLeads} Cold
              </p>
            </div>
          </div>
        )}
        {data.campaignName && (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#F0FDF4' }}>
              <Mail size={14} color="#16A34A"/>
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Campaign "{data.campaignName}"</p>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                {data.emailsSent > 0 ? `${data.emailsSent} emails sent` : `${data.emailsQueued ?? 0} emails queued`}
              </p>
            </div>
          </div>
        )}
        {data.proposalsGenerated > 0 && (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#F5F3FF' }}>
              <FileText size={14} color="#7C3AED"/>
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{data.proposalsGenerated} proposals generated</p>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>Saved to each lead record</p>
            </div>
          </div>
        )}
        {data.followUps > 0 && (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#FFFBEB' }}>
              <RefreshCw size={14} color="#D97706"/>
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{data.followUps} follow-ups sent</p>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>To leads with no reply in 3+ days</p>
            </div>
          </div>
        )}
        <div className="pt-1 flex gap-2">
          <Link to="/leads" className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
            style={{ background: 'var(--brand-light)', color: 'var(--brand)', border: '1px solid rgba(37,99,235,.2)' }}>
            View leads →
          </Link>
          {data.campaignId && (
            <Link to="/campaigns" className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
              style={{ background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
              View campaign →
            </Link>
          )}
          <Link to="/kanban" className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
            style={{ background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
            Pipeline board →
          </Link>
        </div>
      </div>
    </div>
  );
}

function Message({ role, content, provider, pipeline, isNew }) {
  const isUser = role === 'user';
  return (
    <div className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'} ${isNew ? 'animate-fade-up' : ''}`}>
      {!isUser && (
        <div className="h-7 w-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: 'var(--brand)', flexShrink: 0 }}>
          <Bot size={13} color="white"/>
        </div>
      )}
      <div className={`max-w-[86%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
        <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${isUser ? 'rounded-br-md' : 'rounded-bl-md'}`}
          style={isUser
            ? { background: 'var(--brand)', color: 'white' }
            : { background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', boxShadow: '0 1px 3px rgba(0,0,0,.04)' }
          }>
          <p className="whitespace-pre-wrap">{content}</p>
          {provider && !isUser && (
            <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-wider opacity-50">via {provider}</p>
          )}
        </div>
        {pipeline && <PipelineResult data={pipeline}/>}
      </div>
    </div>
  );
}

function TypingDots({ step }) {
  return (
    <div className="flex gap-2.5 justify-start animate-fade-up">
      <div className="h-7 w-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: 'var(--brand)', flexShrink: 0 }}>
        <Bot size={13} color="white"/>
      </div>
      <div className="rounded-2xl rounded-bl-md px-4 py-2.5"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
        {step ? (
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-2)' }}>
            <Zap size={11} color="var(--brand)" className="animate-pulse shrink-0"/>
            <span>{step}</span>
          </div>
        ) : (
          <div className="flex gap-1.5 items-center h-4">
            {[0,1,2].map(i => (
              <div key={i} className="h-1.5 w-1.5 rounded-full"
                style={{ background: 'var(--brand)', animation: `pulseDot 1.4s ease-in-out ${i * 0.2}s infinite` }}/>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AIPage() {
  const [providers, setProviders]       = useState([]);
  const [messages, setMessages]         = useState([{
    role: 'assistant',
    content: "Hi! I'm FlowAI — just tell me what you need and I handle everything automatically.\n\nYou can say:\n• \"Find 10 restaurants in California, create campaigns and generate proposals for all\"\n• \"Find dental clinics in London, email them all\"\n• \"Check for replies and follow up\"\n\nWhat do you work on? (Tell me once using the ✏️ button and I'll use it in every task)",
  }]);
  const [input, setInput]               = useState('');
  const [loading, setLoading]           = useState(false);
  const [pipelineStep, setPipelineStep] = useState('');
  const [userContext, setUserContext]   = useState(() => localStorage.getItem('flowai_context') || '');
  const [editingCtx, setEditingCtx]     = useState(false);
  const [draftCtx, setDraftCtx]         = useState('');
  const [kbOffset, setKbOffset]         = useState(0);
  const bottomRef   = useRef(null);
  const inputRef    = useRef(null);
  const containerRef = useRef(null);
  const stepTimer   = useRef(null);

  useEffect(() => {
    api('/ai/providers/health').then(d => setProviders(d.providers || [])).catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      const kh = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setKbOffset(kh);
      if (kh > 0) {
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    };
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => { vv.removeEventListener('resize', update); vv.removeEventListener('scroll', update); };
  }, []);

  function saveContext() {
    localStorage.setItem('flowai_context', draftCtx);
    setUserContext(draftCtx);
    setEditingCtx(false);
  }

  function startStepAnimation(hasPipeline) {
    let i = 0;
    const steps = hasPipeline ? PIPELINE_STEPS : [];
    if (!steps.length) return;
    const tick = () => {
      if (i >= steps.length) return;
      setPipelineStep(steps[i].label);
      i++;
      if (i < steps.length) stepTimer.current = setTimeout(tick, 5000);
    };
    tick();
  }

  function clearSteps() {
    if (stepTimer.current) clearTimeout(stepTimer.current);
    setPipelineStep('');
  }

  const isPipelineCommand = (text) => {
    const l = text.toLowerCase();
    const findWords = ['find', 'discover', 'search', 'get', 'locate', 'look for'];
    const targetWords = ['lead', 'client', 'business', 'restaurant', 'clinic', 'shop', 'company', 'startup', 'agency', 'store', 'hotel', 'firm', 'dentist', 'plumber', 'gym', 'salon', 'school', 'lawyer', 'accountant', 'contractor', 'electrician'];
    const fundingWords = ['investor', 'vc', 'venture capital', 'angel investor', 'seed', 'funding', 'fundraise', 'pitch', 'raise capital', 'funded startup', 'recently funded'];
    const hasFindWord  = findWords.some(w => l.includes(w));
    const hasTarget    = targetWords.some(w => l.includes(w));
    const hasFunding   = fundingWords.some(w => l.includes(w));
    const hasFollowUp  = l.includes('follow up') || l.includes('follow-up') || l.includes('check replies') || l.includes('monitor') || l.includes('who replied');
    return (hasFindWord && hasTarget) || hasFunding || hasFollowUp;
  };

  const isFollowUpCommand = (text) => {
    const l = text.toLowerCase();
    return l.includes('follow up') || l.includes('follow-up') || l.includes('check replies') || l.includes('monitor response') || l.includes('who replied') || l.includes('who responded');
  };

  async function send(text) {
    const content = (text || input).trim();
    if (!content || loading) return;
    const userMsg = { role: 'user', content, isNew: true };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setLoading(true);
    inputRef.current?.focus();

    try {
      if (isPipelineCommand(content)) {
        startStepAnimation(true);

        if (isFollowUpCommand(content)) {
          const data = await api('/ai/follow-up', { method: 'POST', body: { context: userContext } });
          clearSteps();
          setMessages([...next, {
            role: 'assistant',
            content: data.message,
            pipeline: data.pipeline,
            isNew: true,
          }]);
        } else {
          const data = await api('/ai/auto-pipeline', {
            method: 'POST',
            body: { command: content, context: userContext },
          });
          clearSteps();
          setMessages([...next, {
            role: 'assistant',
            content: data.message,
            provider: data.provider,
            pipeline: data.pipeline,
            isNew: true,
          }]);
        }
      } else {
        const systemMsg = userContext
          ? { role: 'system', content: `You are FlowAI, an AI assistant for lead generation and outreach. The user works in: ${userContext}. Always tailor advice and outreach to this context.` }
          : { role: 'system', content: 'You are FlowAI, an AI assistant for lead generation, outreach, and business automation.' };
        const data = await api('/ai/chat', {
          method: 'POST',
          body: { messages: [systemMsg, ...next.map(({ role, content }) => ({ role: role === 'assistant' ? 'assistant' : 'user', content }))] }
        });
        setMessages([...next, { role: 'assistant', content: data.message, provider: data.provider, isNew: true }]);
      }
    } catch (err) {
      clearSteps();
      setMessages([...next, { role: 'assistant', content: `Sorry, something went wrong: ${err.message}`, isNew: true }]);
    } finally {
      setLoading(false);
      clearSteps();
    }
  }

  const onKey = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const activeProvider = providers.find(p => ['online', 'configured'].includes(p.status));

  const suggestions = userContext
    ? [
        `Find 10 clients needing help with ${userContext.split(' ').slice(0,3).join(' ')} — create campaigns and generate proposals`,
        `Find urgent businesses in my area that need ${userContext.split(' ').slice(0,2).join(' ')} services`,
        'Check for replies and follow up with anyone who hasn\'t responded',
        'Score all my current leads and tell me who to contact first',
        ...DEFAULT_SUGGESTIONS.slice(3),
      ]
    : DEFAULT_SUGGESTIONS;

  return (
    <div ref={containerRef}
      className="flex flex-col"
      style={{
        height: 'calc(100dvh - 140px)',
        maxHeight: 900,
        paddingBottom: kbOffset > 0 ? Math.max(0, kbOffset - 72) : 0,
        transition: 'padding-bottom 0.15s ease',
      }}>

      {/* Compact header */}
      <div className="flex items-center gap-2 mb-3 shrink-0 flex-wrap">

        {/* Context bar */}
        <div className="flex-1 min-w-0">
          {editingCtx ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                className="input flex-1 text-sm h-9 py-0"
                placeholder="What do you work on? e.g. 'web design for restaurants in Lagos'"
                value={draftCtx}
                onChange={e => setDraftCtx(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveContext(); if (e.key === 'Escape') setEditingCtx(false); }}
              />
              <button onClick={saveContext} className="btn-primary text-xs h-9 px-3 shrink-0">Save</button>
              <button onClick={() => setEditingCtx(false)} className="btn-secondary text-xs h-9 px-3 shrink-0">✕</button>
            </div>
          ) : (
            <button
              onClick={() => { setDraftCtx(userContext); setEditingCtx(true); }}
              className="flex items-center gap-2 rounded-xl px-3 h-9 w-full text-left transition-all"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <Settings2 size={13} color="var(--text-3)"/>
              <span className="text-xs truncate flex-1" style={{ color: userContext ? 'var(--text)' : 'var(--text-3)' }}>
                {userContext || 'What do you work on? Tap to set context…'}
              </span>
              <span className="text-[10px] font-bold shrink-0" style={{ color: 'var(--brand)' }}>✏️</span>
            </button>
          )}
        </div>

        {/* Provider badge */}
        {activeProvider ? (
          <div className="shrink-0 flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11px] font-semibold"
            style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#15803d' }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#16A34A' }}/>
            {activeProvider.provider}
          </div>
        ) : (
          <Link to="/connections" className="shrink-0 flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11px] font-semibold"
            style={{ background: '#FFFBEB', border: '1px solid #FDE68A', color: '#b45309' }}>
            <AlertCircle size={11}/>
            Add API key
          </Link>
        )}
      </div>

      {/* Messages area */}
      <div
        className="flex-1 overflow-y-auto rounded-2xl p-3 sm:p-4 space-y-3"
        style={{
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
        }}>

        {messages.map((m, i) => (
          <Message key={i} {...m} isNew={m.isNew && i === messages.length - 1}/>
        ))}

        {loading && <TypingDots step={pipelineStep}/>}
        <div ref={bottomRef}/>
      </div>

      {/* Suggestion chips */}
      {messages.length === 1 && !loading && (
        <div className="shrink-0 mt-2">
          <p className="text-[11px] mb-1.5 px-1 font-medium" style={{ color: 'var(--text-3)' }}>Try:</p>
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {suggestions.map(s => (
              <button key={s} onClick={() => send(s)}
                className="shrink-0 text-[11px] rounded-xl px-3 py-2 transition-all whitespace-nowrap font-medium"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-2)' }}
                onTouchStart={e => { e.currentTarget.style.background = 'var(--brand-light)'; e.currentTarget.style.color = 'var(--brand)'; }}
                onTouchEnd={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--text-2)'; }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand)'; e.currentTarget.style.color = 'var(--brand)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)'; }}>
                {s.length > 55 ? s.slice(0, 55) + '…' : s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="shrink-0 mt-2">
        <div className="flex gap-2 rounded-2xl p-2"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
          <textarea
            ref={inputRef}
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm placeholder-[var(--text-3)] outline-none px-2 py-2 leading-relaxed"
            style={{ maxHeight: 100, color: 'var(--text)' }}
            placeholder="Find leads, create campaigns, generate proposals, follow up…"
            value={input}
            onChange={e => {
              setInput(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
            }}
            onKeyDown={onKey}
          />
          <button
            disabled={loading || !input.trim()}
            onClick={() => send()}
            className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 self-end transition-all disabled:opacity-30"
            style={{ background: 'var(--brand)' }}>
            <Send size={16} color="white"/>
          </button>
        </div>
        <p className="text-[10px] text-center mt-1.5" style={{ color: 'var(--text-3)' }}>
          Powered by Groq (free) · Real lead search · Auto-pipeline enabled
        </p>
      </div>
    </div>
  );
}
