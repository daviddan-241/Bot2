import { useEffect, useState } from 'react';
import { Bot, CheckCircle2, Circle, Globe2, KeyRound, Mail, MapPinned, MessageCircle, PlugZap, Save, Send, ShieldCheck } from 'lucide-react';
import { api } from '../utils/api.js';

const mask = '••••••••';

function StatusPill({ connected }) {
  return (
    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold flex items-center gap-1.5 ${
      connected
        ? 'bg-green-50 text-green-700'
        : 'bg-amber-50 text-amber-700'
    }`}
    style={connected
      ? { border: '1px solid #BBF7D0' }
      : { border: '1px solid #FDE68A' }
    }>
      {connected ? <CheckCircle2 size={10}/> : <Circle size={10}/>}
      {connected ? 'Connected' : 'Needs setup'}
    </span>
  );
}

function Card({ icon: Icon, title, subtitle, children, status, color = '#2563EB' }) {
  return (
    <section className="rounded-2xl p-5 sm:p-6 space-y-5"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <div className="h-11 w-11 shrink-0 grid place-items-center rounded-xl" style={{ background: `${color}12`, border: `1px solid ${color}20` }}>
            <Icon size={18} style={{ color }}/>
          </div>
          <div>
            <h3 className="text-base font-bold" style={{ color: 'var(--text)' }}>{title}</h3>
            <p className="mt-0.5 text-sm leading-5" style={{ color: 'var(--text-2)' }}>{subtitle}</p>
          </div>
        </div>
        {status !== undefined && <StatusPill connected={status}/>}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

export default function ConnectionsPage() {
  const [connections, setConnections] = useState({ workspace: {}, email: {}, ai: {}, search: {}, whatsapp: {} });
  const [health, setHealth] = useState({});
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [testPhone, setTestPhone] = useState('+2348012345678');
  const [searchTest, setSearchTest] = useState({ niche: 'dentists', location: 'Lagos', industry: 'Healthcare' });
  const [searchResults, setSearchResults] = useState([]);

  async function load() {
    const data = await api('/connections');
    setConnections({ workspace: {}, email: {}, ai: {}, search: {}, whatsapp: {}, ...data.connections });
    setHealth(data.health || {});
  }
  useEffect(() => { load().catch((err) => setError(err.message)); }, []);

  function setProvider(provider, patch) { setConnections((c) => ({ ...c, [provider]: { ...(c[provider] || {}), ...patch } })); }

  async function save(provider) {
    setError(''); setStatus(`Saving ${provider}…`);
    try {
      const data = await api(`/connections/${provider}`, { method: 'PUT', body: connections[provider] });
      setProvider(provider, data.connection); setStatus(`${provider} saved ✓`); await load();
    } catch (err) { setError(err.message); }
  }

  async function startGmailOAuth() {
    await save('email');
    const data = await api('/connections/gmail/oauth/start');
    window.open(data.authUrl, 'flowai_gmail_oauth', 'width=520,height=720');
    setStatus(`Google OAuth opened. Redirect URI: ${data.redirectUri}`);
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
      setStatus(`${provider} test OK ✓`);
      await load();
    } catch (err) { setError(err.message); }
  }

  const workspace = connections.workspace || {};
  const email = connections.email || {};
  const ai = connections.ai || {};
  const search = connections.search || {};
  const whatsapp = connections.whatsapp || {};

  return (
    <div className="space-y-6">
      <div className="rounded-2xl p-6 sm:p-7 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
        <div>
          <p className="text-xs font-bold uppercase tracking-[.2em] mb-2" style={{ color: 'var(--brand)' }}>Real Integrations</p>
          <h2 className="text-2xl font-black" style={{ color: 'var(--text)', letterSpacing: '-0.02em' }}>Settings & Connections</h2>
          <p className="mt-2 max-w-xl text-sm leading-6" style={{ color: 'var(--text-2)' }}>
            Connect real APIs — Groq (free AI), Gmail OAuth, Serper (free leads). All credentials are encrypted and stored locally.
          </p>
        </div>
        <div className="rounded-xl p-4 shrink-0 flex items-start gap-3"
          style={{ background: '#EFF6FF', border: '1px solid rgba(37,99,235,.15)' }}>
          <ShieldCheck size={18} color="#2563EB" className="mt-0.5"/>
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>Official APIs only</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>No unofficial scraping or automation</p>
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

      <Card icon={Globe2} title="Global workspace" subtitle="Default country, timezone, and currency used across outreach and reports." status={true} color="#2563EB">
        <div className="grid gap-3 sm:grid-cols-4">
          <Field label="Country ISO-2"><input className="input uppercase" maxLength="2" placeholder="US" value={workspace.defaultCountry || 'US'} onChange={(e) => setProvider('workspace', { defaultCountry: e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0,2) })}/></Field>
          <Field label="Timezone"><input className="input" placeholder="America/New_York" value={workspace.timezone || ''} onChange={(e) => setProvider('workspace', { timezone: e.target.value })}/></Field>
          <Field label="Currency"><input className="input uppercase" maxLength="3" placeholder="USD" value={workspace.currency || 'USD'} onChange={(e) => setProvider('workspace', { currency: e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0,3) })}/></Field>
          <Field label="Locale"><input className="input" placeholder="en-US" value={workspace.locale || ''} onChange={(e) => setProvider('workspace', { locale: e.target.value })}/></Field>
        </div>
        <button onClick={() => save('workspace')} className="btn-primary"><Save size={14}/> Save workspace</button>
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card icon={Mail} title="Email / Gmail" subtitle="Send real outreach via Gmail OAuth or your own SMTP credentials." status={health.email?.connected} color="#16A34A">
          <div className="space-y-3">
            <Field label="Method">
              <select className="input" value={email.method || 'smtp'} onChange={(e) => setProvider('email', { method: e.target.value })}>
                <option value="smtp">SMTP / Gmail App Password</option>
                <option value="gmail_oauth">Gmail OAuth (sign in with Google)</option>
              </select>
            </Field>
            {email.method === 'gmail_oauth' ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Google Client ID"><input className="input" value={email.googleClientId || ''} onChange={(e) => setProvider('email', { googleClientId: e.target.value })}/></Field>
                <Field label="Google Client Secret"><input className="input" type="password" value={email.googleClientSecret || ''} onChange={(e) => setProvider('email', { googleClientSecret: e.target.value })}/></Field>
                <Field label="Redirect URI"><input className="input" placeholder="https://your-app.replit.app/connections/gmail/oauth/callback" value={email.googleRedirectUri || ''} onChange={(e) => setProvider('email', { googleRedirectUri: e.target.value })}/></Field>
                <Field label="From name/email"><input className="input" placeholder="FlowAI <you@gmail.com>" value={email.smtpFrom || ''} onChange={(e) => setProvider('email', { smtpFrom: e.target.value })}/></Field>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="SMTP host"><input className="input" placeholder="smtp.gmail.com" value={email.smtpHost || ''} onChange={(e) => setProvider('email', { smtpHost: e.target.value })}/></Field>
                <Field label="SMTP port"><input className="input" type="number" value={email.smtpPort || 587} onChange={(e) => setProvider('email', { smtpPort: Number(e.target.value) })}/></Field>
                <Field label="SMTP user (Gmail)"><input className="input" value={email.smtpUser || ''} onChange={(e) => setProvider('email', { smtpUser: e.target.value })}/></Field>
                <Field label="App password"><input className="input" type="password" value={email.smtpPass || ''} onChange={(e) => setProvider('email', { smtpPass: e.target.value })}/></Field>
                <Field label="From"><input className="input" placeholder="FlowAI <you@example.com>" value={email.smtpFrom || ''} onChange={(e) => setProvider('email', { smtpFrom: e.target.value })}/></Field>
                <label className="flex items-center gap-2 text-sm font-semibold mt-4 cursor-pointer" style={{ color: 'var(--text-2)' }}>
                  <input type="checkbox" className="accent-[#2563EB]" checked={email.smtpSecure === true || email.smtpSecure === 'true'} onChange={(e) => setProvider('email', { smtpSecure: e.target.checked })}/>
                  Use SMTPS/SSL
                </label>
              </div>
            )}
            <div className="flex flex-wrap gap-2 pt-1">
              <input className="input flex-1 min-w-[160px]" placeholder="test@email.com" value={testEmail} onChange={(e) => setTestEmail(e.target.value)}/>
              <button onClick={() => save('email')} className="btn-secondary"><Save size={14}/> Save</button>
              {email.method === 'gmail_oauth' && (
                <button onClick={startGmailOAuth} className="btn-primary"><KeyRound size={14}/> Connect Gmail</button>
              )}
              <button onClick={() => test('email')} className="btn-secondary"><Send size={14}/> Send test</button>
            </div>
            {health.email?.note && (
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                {health.email.note} {health.email.from ? `· From: ${health.email.from}` : ''}
              </p>
            )}
          </div>
        </Card>

        <Card icon={MapPinned} title="Lead discovery" subtitle="Serper, Brave, Google Places + free OpenStreetMap. Add at least one free key." status={Boolean(search.googlePlacesApiKey || search.serperApiKey || search.braveSearchApiKey || search.enableOpenStreetMap !== false)} color="#D97706">
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Serper key (free tier)"><input className="input" type="password" placeholder="Get free at serper.dev" value={search.serperApiKey || ''} onChange={(e) => setProvider('search', { serperApiKey: e.target.value })}/></Field>
              <Field label="Brave Search key"><input className="input" type="password" placeholder="Free at api.search.brave.com" value={search.braveSearchApiKey || ''} onChange={(e) => setProvider('search', { braveSearchApiKey: e.target.value })}/></Field>
              <Field label="Google Places key"><input className="input" type="password" value={search.googlePlacesApiKey || ''} onChange={(e) => setProvider('search', { googlePlacesApiKey: e.target.value })}/></Field>
              <Field label="Bing Search key"><input className="input" type="password" value={search.bingSearchApiKey || ''} onChange={(e) => setProvider('search', { bingSearchApiKey: e.target.value })}/></Field>
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer" style={{ color: 'var(--text-2)' }}>
              <input type="checkbox" className="accent-[#2563EB]" checked={search.enableOpenStreetMap !== false} onChange={(e) => setProvider('search', { enableOpenStreetMap: e.target.checked })}/>
              Enable free OpenStreetMap / Overpass (no API key needed)
            </label>
            <div className="grid gap-2 sm:grid-cols-3">
              <input className="input" placeholder="Niche (e.g. dentists)" value={searchTest.niche} onChange={(e) => setSearchTest({ ...searchTest, niche: e.target.value })}/>
              <input className="input" placeholder="Location (e.g. Lagos)" value={searchTest.location} onChange={(e) => setSearchTest({ ...searchTest, location: e.target.value })}/>
              <input className="input" placeholder="Industry" value={searchTest.industry} onChange={(e) => setSearchTest({ ...searchTest, industry: e.target.value })}/>
            </div>
            <div className="flex gap-2">
              <button onClick={() => save('search')} className="btn-secondary"><Save size={14}/> Save</button>
              <button onClick={() => test('search')} className="btn-primary"><MapPinned size={14}/> Test discovery</button>
            </div>
            {searchResults.length > 0 && (
              <div className="max-h-52 overflow-auto rounded-xl" style={{ border: '1px solid var(--border)' }}>
                {searchResults.map((r, i) => (
                  <div key={i} className="p-3 text-sm last:border-0" style={{ borderBottom: '1px solid var(--border)' }}>
                    <p className="font-semibold" style={{ color: 'var(--text)' }}>{r.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{r.provider} · {r.website || r.phone || r.address}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card icon={MessageCircle} title="WhatsApp" subtitle="Meta WhatsApp Cloud API for real sends. Without credentials, uses wa.me click-to-chat links." status={health.whatsapp?.connected} color="#16A34A">
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Meta access token"><input className="input" type="password" value={whatsapp.whatsappAccessToken || ''} onChange={(e) => setProvider('whatsapp', { whatsappAccessToken: e.target.value })}/></Field>
              <Field label="Phone Number ID"><input className="input" value={whatsapp.whatsappPhoneNumberId || ''} onChange={(e) => setProvider('whatsapp', { whatsappPhoneNumberId: e.target.value })}/></Field>
              <Field label="Business number"><input className="input" placeholder="+1…" value={whatsapp.businessNumber || ''} onChange={(e) => setProvider('whatsapp', { businessNumber: e.target.value })}/></Field>
              <Field label="Webhook verify URL"><input className="input" value={whatsapp.whatsappVerifyUrl || ''} onChange={(e) => setProvider('whatsapp', { whatsappVerifyUrl: e.target.value })}/></Field>
            </div>
            <div className="flex flex-wrap gap-2">
              <input className="input flex-1 min-w-[160px]" placeholder="+1234567890" value={testPhone} onChange={(e) => setTestPhone(e.target.value)}/>
              <button onClick={() => save('whatsapp')} className="btn-secondary"><Save size={14}/> Save</button>
              <button onClick={() => test('whatsapp')} className="btn-primary"><MessageCircle size={14}/> Validate</button>
            </div>
            {health.whatsapp?.note && <p className="text-xs" style={{ color: 'var(--text-3)' }}>{health.whatsapp.note}</p>}
          </div>
        </Card>

        <Card icon={Bot} title="AI providers" subtitle="Groq is free (sign up at console.groq.com). Ollama runs locally. HuggingFace is free tier." status={health.ai?.some?.((p) => ['online','configured'].includes(p.status))} color="#7C3AED">
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Groq API key (free)">
                <input className="input" type="password" placeholder="gsk_..." value={ai.groqApiKey || ''} onChange={(e) => setProvider('ai', { groqApiKey: e.target.value })}/>
              </Field>
              <Field label="Groq model"><input className="input" value={ai.groqModel || 'llama-3.1-8b-instant'} onChange={(e) => setProvider('ai', { groqModel: e.target.value })}/></Field>
              <Field label="Ollama URL (local)"><input className="input" value={ai.ollamaUrl || 'http://localhost:11434/api/generate'} onChange={(e) => setProvider('ai', { ollamaUrl: e.target.value })}/></Field>
              <Field label="Ollama model"><input className="input" value={ai.ollamaModel || 'llama3'} onChange={(e) => setProvider('ai', { ollamaModel: e.target.value })}/></Field>
              <Field label="HuggingFace token"><input className="input" type="password" value={ai.hfApiKey || ''} onChange={(e) => setProvider('ai', { hfApiKey: e.target.value })}/></Field>
              <Field label="HuggingFace model"><input className="input" value={ai.hfModel || 'mistralai/Mistral-7B-Instruct-v0.2'} onChange={(e) => setProvider('ai', { hfModel: e.target.value })}/></Field>
            </div>
            <div className="flex gap-2">
              <button onClick={() => save('ai')} className="btn-secondary"><Save size={14}/> Save</button>
              <button onClick={() => test('ai')} className="btn-primary"><PlugZap size={14}/> Test AI</button>
            </div>
            {health.ai && (
              <div className="grid gap-2 sm:grid-cols-2">
                {health.ai.map((p) => (
                  <div key={p.provider} className="rounded-xl p-3 flex items-start gap-2.5"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0"
                      style={{ background: ['online','configured'].includes(p.status) ? '#16A34A' : 'var(--border-2)' }}/>
                    <div>
                      <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>{p.provider}</p>
                      <p className="text-xs" style={{ color: 'var(--text-3)' }}>{p.status} · {p.model}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
