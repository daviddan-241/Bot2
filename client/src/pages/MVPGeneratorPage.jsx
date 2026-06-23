import { useState } from 'react';
import { ArrowRight, Check, Code2, Copy, Download, FileText, Loader2, Sparkles, Zap } from 'lucide-react';
import { api } from '../utils/api.js';

const CATEGORIES = [
  'SaaS Platform', 'Mobile App', 'E-Commerce', 'Marketplace', 'AI Tool',
  'Portfolio/Blog', 'Dashboard', 'API Service', 'Social Platform', 'Other',
];

const STACKS = [
  { id: 'react_node', label: 'React + Node.js', desc: 'Full-stack JS', color: '#61dafb' },
  { id: 'next',       label: 'Next.js',          desc: 'Full-stack React', color: '#ffffff' },
  { id: 'vue_laravel',label: 'Vue + Laravel',    desc: 'PHP ecosystem', color: '#42b883' },
  { id: 'flutter',    label: 'Flutter',          desc: 'Mobile-first', color: '#54c5f8' },
  { id: 'react_native',label: 'React Native',   desc: 'Cross-platform', color: '#61dafb' },
  { id: 'python',     label: 'Python/FastAPI',   desc: 'API-first', color: '#ffd43b' },
];

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="btn-secondary text-xs py-1.5 px-3 gap-1.5">
      {copied ? <Check size={13} color="#34d399"/> : <Copy size={13}/>}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

function ProposalSection({ title, content, icon: Icon, color = '#a5b0ff' }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,.07)' }}>
      <div className="flex items-center justify-between px-4 py-3"
        style={{ background: 'rgba(255,255,255,.03)', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
        <div className="flex items-center gap-2">
          {Icon && <Icon size={15} color={color}/>}
          <span className="text-sm font-semibold text-white">{title}</span>
        </div>
        <CopyButton text={typeof content === 'string' ? content : JSON.stringify(content, null, 2)}/>
      </div>
      <div className="p-4">
        {typeof content === 'string' ? (
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{content}</p>
        ) : Array.isArray(content) ? (
          <ul className="space-y-2">
            {content.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
                <div className="h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                  <Check size={11} color={color}/>
                </div>
                {typeof item === 'string' ? item : (
                  <div>
                    <span className="font-semibold text-white">{item.name || item.title}: </span>
                    {item.description || item.desc || item.detail || ''}
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <pre className="text-xs text-slate-400 leading-relaxed overflow-auto"
            style={{ maxHeight: 300 }}>
            {JSON.stringify(content, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}

export default function MVPGeneratorPage() {
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: 'SaaS Platform',
    stack: 'react_node',
    budget: 'bootstrap',
    timeline: '8weeks',
    targetUsers: '',
  });
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function generate(e) {
    e.preventDefault();
    setLoading(true); setError(''); setProposal(null);
    try {
      const data = await api('/mvp/generate', { method: 'POST', body: form });
      setProposal(data.proposal);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function downloadProposal() {
    if (!proposal) return;
    const text = [
      `# MVP Proposal: ${proposal.projectName || form.name}`,
      '',
      `## Executive Summary`,
      proposal.summary || '',
      '',
      `## Core Features`,
      ...(proposal.features || []).map((f, i) => `${i+1}. ${typeof f === 'string' ? f : `${f.name}: ${f.description}`}`),
      '',
      `## Tech Stack`,
      ...(proposal.techStack || []).map(t => `- ${typeof t === 'string' ? t : `${t.name}: ${t.reason}`}`),
      '',
      `## Timeline`,
      typeof proposal.timeline === 'string' ? proposal.timeline : JSON.stringify(proposal.timeline, null, 2),
      '',
      `## Pricing Estimate`,
      typeof proposal.pricing === 'string' ? proposal.pricing : JSON.stringify(proposal.pricing, null, 2),
      '',
      `## Getting Started`,
      proposal.gettingStarted || '',
    ].join('\n');

    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(form.name || 'mvp').replace(/\s+/g,'_')}_proposal.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">Tools</p>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Code2 size={22} color="#06b6d4"/> MVP Generator
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Describe your project idea and get a complete proposal: features, tech stack, timeline, and pricing.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={generate} className="rounded-2xl p-5 sm:p-6 space-y-5"
        style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)' }}>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="label">Project name</label>
            <input className="input" placeholder="e.g. FoodRush — Food Delivery Platform" required
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}/>
          </div>

          <div className="sm:col-span-2">
            <label className="label">Describe your MVP idea</label>
            <textarea className="input resize-none" rows={4} required
              placeholder="Describe what it does, who it's for, the main problem it solves, and any key requirements…"
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}/>
          </div>

          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Target users</label>
            <input className="input" placeholder="e.g. small restaurants, freelancers, students…"
              value={form.targetUsers} onChange={e => setForm({ ...form, targetUsers: e.target.value })}/>
          </div>

          <div>
            <label className="label">Budget range</label>
            <select className="input" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })}>
              <option value="bootstrap">Bootstrap ($0 – $5k)</option>
              <option value="startup">Startup ($5k – $25k)</option>
              <option value="funded">Funded ($25k – $100k)</option>
              <option value="enterprise">Enterprise ($100k+)</option>
            </select>
          </div>

          <div>
            <label className="label">Target timeline</label>
            <select className="input" value={form.timeline} onChange={e => setForm({ ...form, timeline: e.target.value })}>
              <option value="4weeks">4 weeks — Rapid MVP</option>
              <option value="8weeks">8 weeks — Standard MVP</option>
              <option value="12weeks">12 weeks — Full MVP</option>
              <option value="6months">6 months — Production ready</option>
            </select>
          </div>
        </div>

        {/* Stack selection */}
        <div>
          <label className="label mb-3">Preferred tech stack</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {STACKS.map(s => (
              <button key={s.id} type="button" onClick={() => setForm({ ...form, stack: s.id })}
                className="rounded-xl px-3 py-3 text-left transition-all"
                style={{
                  background: form.stack === s.id ? 'rgba(92,103,255,.12)' : 'rgba(255,255,255,.02)',
                  border: form.stack === s.id ? '1px solid rgba(92,103,255,.3)' : '1px solid rgba(255,255,255,.07)',
                }}>
                <p className="text-sm font-semibold text-white">{s.label}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{s.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-xl px-4 py-3 text-sm text-red-400"
            style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)' }}>
            {error}
          </div>
        )}

        <button disabled={loading} className="btn-primary w-full py-3 text-base">
          {loading ? (
            <><Loader2 size={18} className="animate-spin"/> Generating proposal…</>
          ) : (
            <><Sparkles size={18}/> Generate MVP proposal <ArrowRight size={16}/></>
          )}
        </button>
      </form>

      {/* Proposal output */}
      {proposal && (
        <div className="space-y-4 animate-fade-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(6,182,212,.15)' }}>
                <FileText size={14} color="#22d3ee"/>
              </div>
              <h2 className="text-lg font-black text-white">
                {proposal.projectName || form.name}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={downloadProposal} className="btn-secondary text-xs py-1.5 px-3 gap-1.5">
                <Download size={13}/> Download .md
              </button>
            </div>
          </div>

          {proposal.summary && (
            <ProposalSection title="Executive Summary" content={proposal.summary} icon={Sparkles} color="#a5b0ff"/>
          )}
          {proposal.features?.length > 0 && (
            <ProposalSection title="Core Features" content={proposal.features} icon={Zap} color="#06b6d4"/>
          )}
          {proposal.techStack?.length > 0 && (
            <ProposalSection title="Tech Stack" content={proposal.techStack} icon={Code2} color="#5c67ff"/>
          )}
          {proposal.timeline && (
            <ProposalSection title="Development Timeline" content={proposal.timeline} icon={FileText} color="#7c3aed"/>
          )}
          {proposal.pricing && (
            <ProposalSection title="Pricing Estimate" content={proposal.pricing} icon={FileText} color="#fbbf24"/>
          )}
          {proposal.gettingStarted && (
            <ProposalSection title="Getting Started" content={proposal.gettingStarted} icon={ArrowRight} color="#34d399"/>
          )}
          {proposal.risks && (
            <ProposalSection title="Risks & Mitigations" content={proposal.risks} icon={FileText} color="#f87171"/>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button onClick={() => { setProposal(null); setForm({ ...form, description: '' }); }}
              className="btn-secondary flex-1">
              Generate another
            </button>
            <a href={`mailto:?subject=MVP Proposal: ${form.name}&body=${encodeURIComponent(proposal.summary || '')}`}
              className="btn-primary flex-1 text-center">
              <ArrowRight size={15}/> Send via email
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
