import { useState } from 'react';
import { ArrowRight, Check, Code2, Copy, Download, FileText, Loader2, Sparkles, Zap } from 'lucide-react';
import { api } from '../utils/api.js';

const CATEGORIES = [
  'SaaS Platform', 'Mobile App', 'E-Commerce', 'Marketplace', 'AI Tool',
  'Portfolio/Blog', 'Dashboard', 'API Service', 'Social Platform', 'Other',
];

const STACKS = [
  { id: 'react_node', label: 'React + Node.js', desc: 'Full-stack JS' },
  { id: 'next',       label: 'Next.js',          desc: 'Full-stack React' },
  { id: 'vue_laravel',label: 'Vue + Laravel',    desc: 'PHP ecosystem' },
  { id: 'flutter',    label: 'Flutter',          desc: 'Mobile-first' },
  { id: 'react_native',label: 'React Native',   desc: 'Cross-platform' },
  { id: 'python',     label: 'Python/FastAPI',   desc: 'API-first' },
];

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="btn-secondary text-xs py-1.5 px-3 gap-1.5" style={{ minHeight: 32, height: 32 }}>
      {copied ? <Check size={12} color="#16A34A"/> : <Copy size={12}/>}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

function ProposalSection({ title, content, icon: Icon, color = '#2563EB' }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
      <div className="flex items-center justify-between px-4 py-3"
        style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          {Icon && <Icon size={15} color={color}/>}
          <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{title}</span>
        </div>
        <CopyButton text={typeof content === 'string' ? content : JSON.stringify(content, null, 2)}/>
      </div>
      <div className="p-4" style={{ background: 'var(--surface)' }}>
        {typeof content === 'string' ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-2)' }}>{content}</p>
        ) : Array.isArray(content) ? (
          <ul className="space-y-2">
            {content.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: 'var(--text-2)' }}>
                <div className="h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: '#EFF6FF' }}>
                  <Check size={11} color="#2563EB"/>
                </div>
                {typeof item === 'string' ? item : (
                  <div>
                    <span className="font-semibold" style={{ color: 'var(--text)' }}>{item.name || item.title}: </span>
                    {item.description || item.desc || item.detail || ''}
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <pre className="text-xs leading-relaxed overflow-auto" style={{ color: 'var(--text-3)', maxHeight: 300 }}>
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
      '', `## Executive Summary`, proposal.summary || '',
      '', `## Core Features`,
      ...(proposal.features || []).map((f, i) => `${i+1}. ${typeof f === 'string' ? f : `${f.name}: ${f.description}`}`),
      '', `## Tech Stack`,
      ...(proposal.techStack || []).map(t => `- ${typeof t === 'string' ? t : `${t.name}: ${t.reason}`}`),
      '', `## Timeline`,
      typeof proposal.timeline === 'string' ? proposal.timeline : JSON.stringify(proposal.timeline, null, 2),
      '', `## Pricing Estimate`,
      typeof proposal.pricing === 'string' ? proposal.pricing : JSON.stringify(proposal.pricing, null, 2),
      '', `## Getting Started`, proposal.gettingStarted || '',
    ].join('\n');
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(form.name || 'mvp').replace(/\s+/g,'_')}_proposal.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadHtml() {
    if (!proposal) return;
    const featureList = (proposal.features || []).map(f =>
      `<li>${typeof f === 'string' ? f : `<strong>${f.name}</strong>: ${f.description || ''}`}</li>`
    ).join('\n          ');
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${proposal.projectName || form.name} — MVP Proposal</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, sans-serif; background: #F8FAFC; color: #0F172A; }
    .hero { background: linear-gradient(135deg, #1d4ed8 0%, #2563EB 100%); color: white; padding: 80px 24px; text-align: center; }
    .hero h1 { font-size: clamp(28px, 5vw, 48px); font-weight: 900; letter-spacing: -0.03em; margin-bottom: 16px; }
    .hero p { font-size: 18px; opacity: 0.85; max-width: 600px; margin: 0 auto; line-height: 1.6; }
    .container { max-width: 900px; margin: 0 auto; padding: 48px 24px; }
    .section { background: white; border: 1px solid #E2E8F0; border-radius: 16px; padding: 32px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,.05); }
    .section h2 { font-size: 20px; font-weight: 800; color: #0F172A; margin-bottom: 16px; display: flex; align-items: center; gap: 10px; }
    .section h2::before { content: ''; display: inline-block; width: 4px; height: 20px; background: #2563EB; border-radius: 2px; }
    .section p { color: #475569; line-height: 1.7; }
    .features { list-style: none; display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; }
    .features li { background: #EFF6FF; border: 1px solid rgba(37,99,235,.15); border-radius: 12px; padding: 16px; color: #1e40af; font-size: 14px; }
    .cta { text-align: center; padding: 40px 24px; }
    .btn { display: inline-block; background: #2563EB; color: white; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; }
    .meta { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; }
    .meta-item { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px; text-align: center; }
    .meta-item .label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: #94A3B8; margin-bottom: 6px; }
    .meta-item .value { font-size: 18px; font-weight: 800; color: #0F172A; }
  </style>
</head>
<body>
  <div class="hero">
    <h1>${proposal.projectName || form.name}</h1>
    <p>${proposal.summary || form.description}</p>
  </div>
  <div class="container">
    <div class="meta" style="margin-bottom: 24px;">
      <div class="meta-item"><div class="label">Category</div><div class="value">${form.category}</div></div>
      <div class="meta-item"><div class="label">Timeline</div><div class="value">${form.timeline.replace('weeks',' wks').replace('months',' mo')}</div></div>
      <div class="meta-item"><div class="label">Budget</div><div class="value">${form.budget.charAt(0).toUpperCase() + form.budget.slice(1)}</div></div>
      <div class="meta-item"><div class="label">Stack</div><div class="value">${form.stack.replace('_',' ')}</div></div>
    </div>
    ${proposal.features?.length ? `
    <div class="section">
      <h2>Core Features</h2>
      <ul class="features">
          ${featureList}
      </ul>
    </div>` : ''}
    ${proposal.gettingStarted ? `
    <div class="section">
      <h2>Getting Started</h2>
      <p style="white-space: pre-line;">${proposal.gettingStarted}</p>
    </div>` : ''}
    ${proposal.pricing ? `
    <div class="section">
      <h2>Investment</h2>
      <p style="white-space: pre-line;">${typeof proposal.pricing === 'string' ? proposal.pricing : JSON.stringify(proposal.pricing, null, 2)}</p>
    </div>` : ''}
    <div class="cta">
      <a href="mailto:?subject=MVP Proposal: ${form.name}" class="btn">Get in touch →</a>
    </div>
  </div>
</body>
</html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(form.name || 'mvp').replace(/\s+/g,'_')}_proposal.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Header */}
      <div>
        <p className="text-xs font-bold uppercase tracking-[.2em] mb-1" style={{ color: 'var(--brand)' }}>Tools</p>
        <h1 className="text-2xl font-black flex items-center gap-2" style={{ color: 'var(--text)', letterSpacing: '-0.02em' }}>
          <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: '#ECFEFF' }}>
            <Code2 size={18} color="#0891B2"/>
          </div>
          MVP Generator
        </h1>
        <p className="text-sm mt-1 ml-11" style={{ color: 'var(--text-2)' }}>
          Describe any project and get a complete proposal with features, timeline, pricing — and a downloadable HTML page.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={generate} className="rounded-2xl p-5 sm:p-6 space-y-5"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="label">Project name</label>
            <input className="input" placeholder="e.g. FoodRush — Food Delivery Platform" required
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}/>
          </div>

          <div className="sm:col-span-2">
            <label className="label">Describe your MVP idea</label>
            <textarea className="input resize-none" rows={4} required
              placeholder="Describe what it does, who it's for, the main problem it solves, and key requirements…"
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
            <input className="input" placeholder="e.g. small restaurants, freelancers…"
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
                  background: form.stack === s.id ? 'var(--brand-light)' : 'var(--surface-2)',
                  border: form.stack === s.id ? '1px solid rgba(37,99,235,.3)' : '1px solid var(--border)',
                }}>
                <p className="text-sm font-semibold" style={{ color: form.stack === s.id ? 'var(--brand)' : 'var(--text)' }}>{s.label}</p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-3)' }}>{s.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-xl px-4 py-3 text-sm text-red-700"
            style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
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
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl flex items-center justify-center"
                style={{ background: '#ECFEFF' }}>
                <FileText size={15} color="#0891B2"/>
              </div>
              <h2 className="text-lg font-black" style={{ color: 'var(--text)', letterSpacing: '-0.02em' }}>
                {proposal.projectName || form.name}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={downloadHtml} className="btn-primary text-xs py-1.5 px-3 gap-1.5" style={{ minHeight: 36 }}>
                <Download size={13}/> Download HTML
              </button>
              <button onClick={downloadProposal} className="btn-secondary text-xs py-1.5 px-3 gap-1.5" style={{ minHeight: 36 }}>
                <Download size={13}/> .md
              </button>
            </div>
          </div>

          {proposal.summary && (
            <ProposalSection title="Executive Summary" content={proposal.summary} icon={Sparkles} color="#7C3AED"/>
          )}
          {proposal.features?.length > 0 && (
            <ProposalSection title="Core Features" content={proposal.features} icon={Zap} color="#0891B2"/>
          )}
          {proposal.techStack?.length > 0 && (
            <ProposalSection title="Tech Stack" content={proposal.techStack} icon={Code2} color="#2563EB"/>
          )}
          {proposal.timeline && (
            <ProposalSection title="Development Timeline" content={proposal.timeline} icon={FileText} color="#D97706"/>
          )}
          {proposal.pricing && (
            <ProposalSection title="Pricing Estimate" content={proposal.pricing} icon={FileText} color="#16A34A"/>
          )}
          {proposal.gettingStarted && (
            <ProposalSection title="Getting Started" content={proposal.gettingStarted} icon={ArrowRight} color="#2563EB"/>
          )}
          {proposal.risks && (
            <ProposalSection title="Risks & Mitigations" content={proposal.risks} icon={FileText} color="#DC2626"/>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button onClick={() => { setProposal(null); setForm({ ...form, description: '' }); }}
              className="btn-secondary flex-1">
              Generate another
            </button>
            <button onClick={downloadHtml} className="btn-primary flex-1">
              <Download size={15}/> Download client-ready HTML
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
