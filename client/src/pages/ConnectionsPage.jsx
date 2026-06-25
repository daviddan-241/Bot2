import { useEffect, useState } from 'react';
import { Bot, CheckCircle2, Circle, ExternalLink, Globe2, Mail, MapPinned, MessageCircle, Save, Send, ShieldCheck, Zap } from 'lucide-react';
import { api } from '../utils/api.js';

function StatusPill({ connected }) {
  return (
    <span className="shrink-0 rounded-full px-3 py-1 text-xs font-bold flex items-center gap-1.5"
      style={connected
        ? { background: '#F0FDF4', color: '#15803d', border: '1px solid #BBF7D0' }
        : { background: '#FFFBEB', color: '#b45309', border: '1px solid #FDE68A' }}>
      {connected ? <CheckCircle2 size={10}/> : <Circle size={10}/>}
      {connected ? 'Connected' : 'Not set'}
    </span>
  );
}

function Card({ icon: Icon, title, subtitle, status, color = '#2563EB', badge, children }) {
  return (
    <section className="rounded-2xl p-5 sm:p-6 space-y-5"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <div className="h-11 w-11 shrink-0 grid place-items-center rounded-xl"
            style={{ background: `${color}12`, border: `1px solid ${color}20` }}>
            <Icon size={18} style={{ color }}/>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold" style={{ color: 'var(--text)' }}>{title}</h3>
              {badge && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE' }}>
                  {badge}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm leading-5" style={{ color: 'var(--text-2)' }}>{subtitle}</p>
          </div>
        </div>
        {status !== undefined && <StatusPill connected={status}/>}
      </div>
      {children}
    </section>
  );
}

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between mb-1">
        <span className="label">{label}</span>
        {hint && <span className="text-[10px]" style={{ color: 'var(--text-3)' }}>{hint}</span>}
      </div>
      {children}
    </label>
  );
}

function EnvHint({ name }) {
  return (
    <span className="text-[10px] font-mono px-2 py-0.5 rounded"
      style={{ background: 'var(--surface-2)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
      env: {name}
    </span>
  );
}

export default function ConnectionsPage() {
  const [connections, setConnections] = useState({ workspace: {}, email: {}, ai: {}, search: {}, whatsapp: {} });
  const [health, setHealth]           = useState({});
  const [status, setStatus]           = useState('');
  const [error, setError]             = useState('');
  const [testEmail, setTestEmail]     = useState('');
  const [testPhone, setTestPhone]     = useState('+1234567890');
  const [searchTest, setSearchTest]   = useState({ niche: 'dentists', location: 'Lagos', industry: 'Healthcare' });
  const [searchResults, setSearchResults] = useState([]);

  async function load() {
    try {
      const data = await api('/connections');
      setConnections({ workspace: {}, email: {}, ai: {}, search: {}, whatsapp: {}, ...data.connections });
      setHealth(data.health || {});
    } catch (err) { setError(err.message); }
  }
  useEffect(() => { load(); }, []);

  const set = (provider, patch) => setConnections(c => ({ ...c, [provider]: { ...(c[provider] || {}), ...patch } }));

  async function save(provider) {
    setError(''); setStatus(`Saving ${provider}…`);
    try {
      const data = await api(`/connections/${provider}`, { method: 'PUT', body: connections[provider] });
      set(provider, data.connection);
      setStatus(`✓ ${provider} saved`);
      await load();
    } catch (err) { setError(err.message); setStatus(''); }
  }

  async function test(provider) {
    setError(''); setStatus(`Testing ${provider}…`);
    try {
      let body = {};
      if (provider === 'email') body = { to: testEmail || undefined };
      if (provider === 'whatsapp') body = { phone: testPhone, country: (connections.workspace?.defaultCountry || 'US').toUpperCase() };
      if (provider === 'search') body = { ...searchTest, limit: 5 };
      const data = await api(`/connections/${provider}/test`, { method: 'POST', body });
      if (provider === 'search') setSearchResults(data.results || []);
      setStatus(`✓ ${provider} test passed`);
      await load();
    } catch (err) { setError(err.message); setStatus(''); }
  }

  const { email = {}, ai = {}, search = {}, workspace = {}, whatsapp = {} } = connections;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="rounded-2xl p-6 sm:p-7 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div>
          <p className="text-xs font-bold uppercase tracking-[.2em] mb-1" style={{ color: 'var(--brand)' }}>Free Tools Only</p>
          <h2 className="text-2xl font-black" style={{ color: 'var(--text)', letterSpacing: '-0.02em' }}>Settings & Connections</h2>
          <p className="mt-2 max-w-xl text-sm leading-6" style={{ color: 'var(--text-2)' }}>
            All integrations here are free. Add your keys below <em>or</em> set them as environment variables on Render — either way works.
          </p>
        </div>
        <div className="rounded-xl p-4 shrink-0 flex items-start gap-3"
          style={{ background: '#EFF6FF', border: '1px solid rgba(37,99,235,.15)' }}>
          <ShieldCheck size={18} color="#2563EB" className="mt-0.5 shrink-0"/>
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>100% free stack</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>
              Groq AI · Gmail SMTP · Serper · Brave · OpenStreetMap
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl p-4 text-sm font-semibold text-red-700"
          style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
          {error}
        </div>
      )}
      {status && (
        <div className="rounded-xl p-4 text-sm font-semibold"
          style={{ background: '#EFF6FF', border: '1px solid rgba(37,99,235,.15)', color: 'var(--brand)' }}>
          {status}
        </div>
      )}

      {/* Email */}
      <Card icon={Mail} title="Gmail Email" subtitle="Send real outreach emails. Uses Gmail App Password — no OAuth needed." status={health.email?.connected} color="#16A34A" badge="FREE">
        <div className="rounded-xl p-4 mb-2 text-sm space-y-1"
          style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
          <p className="font-bold text-sm" style={{ color: '#15803d' }}>📋 3-step Gmail setup</p>
          <ol className="list-decimal list-inside space-y-1 text-xs" style={{ color: '#166534' }}>
            <li>Enable 2-Step Verification on your Google account</li>
            <li>Go to <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="underline font-semibold">myaccount.google.com → Security → App Passwords</a></li>
            <li>Create an App Password for "Mail" — paste the 16-char code below</li>
          </ol>
          <p className="text-xs pt-1" style={{ color: '#166534' }}>
            On Render: set <code className="font-mono bg-green-100 px-1 rounded">SMTP_USER</code> and <code className="font-mono bg-green-100 px-1 rounded">SMTP_PASS</code> in Environment Variables.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Your Gmail address" hint={<EnvHint name="SMTP_USER"/>}>
            <input className="input" type="email" placeholder="you@gmail.com"
              value={email.smtpUser || ''} onChange={e => set('email', { smtpUser: e.target.value, smtpHost: 'smtp.gmail.com', smtpPort: 587, method: 'smtp' })}/>
          </Field>
          <Field label="Gmail App Password" hint={<EnvHint name="SMTP_PASS"/>}>
            <input className="input" type="password" placeholder="xxxx xxxx xxxx xxxx"
              value={email.smtpPass || ''} onChange={e => set('email', { smtpPass: e.target.value })}/>
          </Field>
          <Field label="From name (optional)">
            <input className="input" placeholder={`FlowAI <${email.smtpUser || 'you@gmail.com'}>`}
              value={email.smtpFrom || ''} onChange={e => set('email', { smtpFrom: e.target.value })}/>
          </Field>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <input className="input flex-1 min-w-[160px]" type="email" placeholder="Send test to this address"
            value={testEmail} onChange={e => setTestEmail(e.target.value)}/>
          <button onClick={() => save('email')} className="btn-primary"><Save size={14}/> Save</button>
          <button onClick={() => test('email')} className="btn-secondary"><Send size={14}/> Send test</button>
        </div>
        {health.email?.note && (
          <p className="text-xs" style={{ color: health.email.connected ? '#15803d' : 'var(--text-3)' }}>
            {health.email.connected ? '✓' : '○'} {health.email.note}
            {health.email.from ? ` · Sending as: ${health.email.from}` : ''}
          </p>
        )}
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">

        {/* AI */}
        <Card icon={Bot} title="AI Provider" subtitle="Groq is free (14,400 req/day). Ollama runs fully offline on your machine." status={health.ai?.some?.(p => ['online','configured'].includes(p.status))} color="#7C3AED" badge="FREE">
          <div className="rounded-xl p-3 text-xs mb-1"
            style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', color: '#5b21b6' }}>
            <strong>Built-in rule engine</strong> always runs with no setup — works offline, no API key needed.
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Groq API key (free)" hint={<EnvHint name="GROQ_API_KEY"/>}>
              <input className="input" type="password" placeholder="gsk_… — get free at console.groq.com"
                value={ai.groqApiKey || ''} onChange={e => set('ai', { groqApiKey: e.target.value })}/>
            </Field>
            <Field label="Groq model">
              <input className="input" value={ai.groqModel || 'llama-3.1-8b-instant'}
                onChange={e => set('ai', { groqModel: e.target.value })}/>
            </Field>
            <Field label="Ollama URL (local/offline)" hint={<EnvHint name="OLLAMA_URL"/>}>
              <input className="input" placeholder="http://localhost:11434/api/generate"
                value={ai.ollamaUrl || ''} onChange={e => set('ai', { ollamaUrl: e.target.value })}/>
            </Field>
            <Field label="Ollama model" hint="~630 MB">
              <input className="input" placeholder="llama3.2:1b  ← run: ollama pull llama3.2:1b"
                value={ai.ollamaModel || ''} onChange={e => set('ai', { ollamaModel: e.target.value })}/>
            </Field>
          </div>
          <button onClick={() => save('ai')} className="btn-primary"><Save size={14}/> Save AI settings</button>
          {health.ai && (
            <div className="grid gap-2 sm:grid-cols-3">
              {health.ai.map(p => (
                <div key={p.provider} className="rounded-xl p-3 flex items-start gap-2"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                  <div className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0"
                    style={{ background: ['online','configured'].includes(p.status) ? '#16A34A' : '#E2E8F0' }}/>
                  <div>
                    <p className="text-xs font-bold" style={{ color: 'var(--text)' }}>{p.provider}</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-3)' }}>{p.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Lead Discovery */}
        <Card icon={MapPinned} title="Lead Discovery" subtitle="Serper and Brave are free tiers. OpenStreetMap is always on — no key needed." status={Boolean(search.serperApiKey || search.braveSearchApiKey || search.enableOpenStreetMap !== false)} color="#D97706" badge="FREE">
          <div className="rounded-xl p-3 text-xs mb-1"
            style={{ background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400e' }}>
            <strong>OpenStreetMap</strong> is always enabled with no setup — finds real businesses worldwide for free.
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Serper key (2,500 free/mo)" hint={<EnvHint name="SERPER_API_KEY"/>}>
              <input className="input" type="password" placeholder="Get free at serper.dev"
                value={search.serperApiKey || ''} onChange={e => set('search', { serperApiKey: e.target.value })}/>
            </Field>
            <Field label="Brave Search key (2,000 free/mo)" hint={<EnvHint name="BRAVE_SEARCH_API_KEY"/>}>
              <input className="input" type="password" placeholder="Free at api.search.brave.com"
                value={search.braveSearchApiKey || ''} onChange={e => set('search', { braveSearchApiKey: e.target.value })}/>
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer" style={{ color: 'var(--text-2)' }}>
            <input type="checkbox" className="accent-[#2563EB]"
              checked={search.enableOpenStreetMap !== false}
              onChange={e => set('search', { enableOpenStreetMap: e.target.checked })}/>
            OpenStreetMap / Overpass (always free, no key)
          </label>
          <div className="grid gap-2 sm:grid-cols-3">
            <input className="input" placeholder="Niche (e.g. dentists)"
              value={searchTest.niche} onChange={e => setSearchTest({ ...searchTest, niche: e.target.value })}/>
            <input className="input" placeholder="Location (e.g. Lagos)"
              value={searchTest.location} onChange={e => setSearchTest({ ...searchTest, location: e.target.value })}/>
            <input className="input" placeholder="Industry"
              value={searchTest.industry} onChange={e => setSearchTest({ ...searchTest, industry: e.target.value })}/>
          </div>
          <div className="flex gap-2">
            <button onClick={() => save('search')} className="btn-secondary"><Save size={14}/> Save</button>
            <button onClick={() => test('search')} className="btn-primary"><MapPinned size={14}/> Test discovery</button>
          </div>
          {searchResults.length > 0 && (
            <div className="max-h-48 overflow-auto rounded-xl" style={{ border: '1px solid var(--border)' }}>
              {searchResults.map((r, i) => (
                <div key={i} className="p-3 text-sm" style={{ borderBottom: i < searchResults.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <p className="font-semibold" style={{ color: 'var(--text)' }}>{r.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                    {r.provider} · {r.website || r.phone || r.address || r.email || '—'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* WhatsApp */}
        <Card icon={MessageCircle} title="WhatsApp" subtitle="Meta WhatsApp Cloud API for real sends. Without this, app generates wa.me click links — still useful." status={health.whatsapp?.connected} color="#16A34A">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Meta access token">
              <input className="input" type="password" placeholder="From Meta for Developers → WhatsApp"
                value={whatsapp.whatsappAccessToken || ''} onChange={e => set('whatsapp', { whatsappAccessToken: e.target.value })}/>
            </Field>
            <Field label="Phone Number ID">
              <input className="input" placeholder="From Meta Business Manager"
                value={whatsapp.whatsappPhoneNumberId || ''} onChange={e => set('whatsapp', { whatsappPhoneNumberId: e.target.value })}/>
            </Field>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <input className="input flex-1 min-w-[160px]" placeholder="+1234567890"
              value={testPhone} onChange={e => setTestPhone(e.target.value)}/>
            <button onClick={() => save('whatsapp')} className="btn-secondary"><Save size={14}/> Save</button>
            <button onClick={() => test('whatsapp')} className="btn-primary"><MessageCircle size={14}/> Validate</button>
          </div>
          {health.whatsapp?.note && (
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>{health.whatsapp.note}</p>
          )}
        </Card>

        {/* Workspace */}
        <Card icon={Globe2} title="Workspace defaults" subtitle="Default country and currency used in outreach and reports." status={true} color="#2563EB">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Country (ISO-2)">
              <input className="input uppercase" maxLength="2" placeholder="US"
                value={workspace.defaultCountry || 'US'}
                onChange={e => set('workspace', { defaultCountry: e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2) })}/>
            </Field>
            <Field label="Currency">
              <input className="input uppercase" maxLength="3" placeholder="USD"
                value={workspace.currency || 'USD'}
                onChange={e => set('workspace', { currency: e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3) })}/>
            </Field>
            <Field label="Timezone">
              <input className="input" placeholder="America/New_York"
                value={workspace.timezone || ''}
                onChange={e => set('workspace', { timezone: e.target.value })}/>
            </Field>
          </div>
          <button onClick={() => save('workspace')} className="btn-primary"><Save size={14}/> Save workspace</button>
        </Card>
      </div>

      {/* Render deploy guide */}
      <div className="rounded-2xl p-5 sm:p-6"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Zap size={16} color="#2563EB"/>
          <h3 className="text-base font-bold" style={{ color: 'var(--text)' }}>Deploy to Render (free)</h3>
        </div>
        <p className="text-sm mb-4" style={{ color: 'var(--text-2)' }}>
          In your Render dashboard → Environment tab, add these variables:
        </p>
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          {[
            ['SMTP_USER', 'your Gmail address'],
            ['SMTP_PASS', '16-char Gmail App Password'],
            ['SMTP_FROM', 'FlowAI <you@gmail.com>'],
            ['GROQ_API_KEY', 'from console.groq.com (free)'],
            ['SERPER_API_KEY', 'from serper.dev (free, optional)'],
            ['BRAVE_SEARCH_API_KEY', 'from api.search.brave.com (free, optional)'],
          ].map(([key, hint], i, arr) => (
            <div key={key} className="flex items-center gap-3 px-4 py-2.5"
              style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none', background: i % 2 === 0 ? 'var(--bg)' : 'var(--surface)' }}>
              <code className="text-xs font-mono font-bold shrink-0" style={{ color: 'var(--brand)' }}>{key}</code>
              <span className="text-xs" style={{ color: 'var(--text-3)' }}>{hint}</span>
            </div>
          ))}
        </div>
        <p className="text-xs mt-3" style={{ color: 'var(--text-3)' }}>
          OpenStreetMap lead discovery works with zero configuration — no key needed.
          The rule engine AI works offline with no API key.
        </p>
      </div>
    </div>
  );
}
