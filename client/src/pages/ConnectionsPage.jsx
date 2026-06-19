import { useEffect, useState } from 'react';
import { Bot, CheckCircle2, Globe2, KeyRound, Mail, MapPinned, MessageCircle, PlugZap, Save, Send, ShieldCheck } from 'lucide-react';
import { api } from '../utils/api.js';

const mask = '••••••••';

function Card({ icon: Icon, title, subtitle, children, status }) {
  return (
    <section className="glass-card p-5 sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300"><Icon size={20}/></div>
          <div><h3 className="text-lg font-black text-slate-950 dark:text-white">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{subtitle}</p></div>
        </div>
        {status && <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${status.connected ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'}`}>{status.connected ? 'Connected' : 'Needs setup'}</span>}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }) {
  return <label className="block"><span className="label">{label}</span>{children}</label>;
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
    setError(''); setStatus(`Saving ${provider} connection…`);
    try { const data = await api(`/connections/${provider}`, { method: 'PUT', body: connections[provider] }); setProvider(provider, data.connection); setStatus(`${provider} connection saved.`); await load(); }
    catch (err) { setError(err.message); }
  }
  async function startGmailOAuth() {
    await save('email');
    const data = await api('/connections/gmail/oauth/start');
    window.open(data.authUrl, 'leadflow_gmail_oauth', 'width=520,height=720');
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
      setStatus(`${provider} test completed: ${JSON.stringify(data).slice(0, 220)}…`);
      await load();
    } catch (err) { setError(err.message); }
  }

  const workspace = connections.workspace || {}, email = connections.email || {}, ai = connections.ai || {}, search = connections.search || {}, whatsapp = connections.whatsapp || {};

  return (
    <div className="space-y-5">
      <div className="glass-card overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[.2em] text-blue-600">Real integrations</p>
            <h2 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">Connections</h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-500 dark:text-slate-400">Connect providers from the site instead of editing `.env`. Secrets are encrypted in SQLite and never returned in plain text. No fake sends: if a provider is not connected, actions fail safely or use real click-to-chat links where official APIs are unavailable.</p>
          </div>
          <div className="rounded-3xl border border-blue-200 bg-blue-50 p-4 text-sm font-bold text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300"><ShieldCheck className="mb-2"/> Official/legal APIs only</div>
        </div>
      </div>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">{error}</div>}
      {status && <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm font-semibold text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">{status}</div>}

      <Card icon={Globe2} title="Global workspace" status={{ connected: true }} subtitle="Make LeadFlow work worldwide. Set your default country for local phone numbers, plus locale, timezone, and currency used across outreach and reporting.">
        <div className="grid gap-4 sm:grid-cols-4">
          <Field label="Default country ISO-2"><input className="input uppercase" maxLength="2" placeholder="US, NG, GB, IN..." value={workspace.defaultCountry || 'US'} onChange={(e) => setProvider('workspace', { defaultCountry: e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2) })}/></Field>
          <Field label="Timezone"><input className="input" placeholder="Africa/Lagos, America/New_York" value={workspace.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'} onChange={(e) => setProvider('workspace', { timezone: e.target.value })}/></Field>
          <Field label="Currency"><input className="input uppercase" maxLength="3" placeholder="USD, NGN, GBP" value={workspace.currency || 'USD'} onChange={(e) => setProvider('workspace', { currency: e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3) })}/></Field>
          <Field label="Locale"><input className="input" placeholder="en-US" value={workspace.locale || navigator.language || 'en-US'} onChange={(e) => setProvider('workspace', { locale: e.target.value })}/></Field>
        </div>
        <div className="mt-4 flex flex-wrap gap-2"><button onClick={() => save('workspace')} className="btn-primary"><Save size={16}/> Save global settings</button></div>
        <p className="mt-3 text-xs leading-6 text-slate-500 dark:text-slate-400">Tip: numbers with a + country code work anywhere. For local numbers without +, LeadFlow uses this default country to normalize WhatsApp/phone data.</p>
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card icon={Mail} title="Email / Gmail" status={health.email} subtitle="Send real outreach from a Gmail OAuth connection or your own SMTP credentials saved from this page.">
          <div className="grid gap-4">
            <Field label="Method"><select className="input" value={email.method || 'smtp'} onChange={(e) => setProvider('email', { method: e.target.value })}><option value="smtp">SMTP / Gmail App Password</option><option value="gmail_oauth">Gmail OAuth sign-in</option></select></Field>
            {email.method === 'gmail_oauth' && <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Google OAuth Client ID"><input className="input" value={email.googleClientId || ''} onChange={(e) => setProvider('email', { googleClientId: e.target.value })}/></Field>
              <Field label="Google OAuth Client Secret"><input className="input" type="password" value={email.googleClientSecret || ''} onChange={(e) => setProvider('email', { googleClientSecret: e.target.value })}/></Field>
              <Field label="Redirect URI"><input className="input" placeholder="http://localhost:5000/connections/gmail/oauth/callback" value={email.googleRedirectUri || ''} onChange={(e) => setProvider('email', { googleRedirectUri: e.target.value })}/></Field>
              <Field label="From name/email"><input className="input" placeholder="LeadFlow AI <you@gmail.com>" value={email.smtpFrom || ''} onChange={(e) => setProvider('email', { smtpFrom: e.target.value })}/></Field>
            </div>}
            {email.method !== 'gmail_oauth' && <div className="grid gap-4 sm:grid-cols-2">
              <Field label="SMTP host"><input className="input" placeholder="smtp.gmail.com" value={email.smtpHost || ''} onChange={(e) => setProvider('email', { smtpHost: e.target.value })}/></Field>
              <Field label="SMTP port"><input className="input" type="number" value={email.smtpPort || 587} onChange={(e) => setProvider('email', { smtpPort: Number(e.target.value) })}/></Field>
              <Field label="SMTP user"><input className="input" value={email.smtpUser || ''} onChange={(e) => setProvider('email', { smtpUser: e.target.value })}/></Field>
              <Field label="SMTP password / app password"><input className="input" type="password" value={email.smtpPass || ''} onChange={(e) => setProvider('email', { smtpPass: e.target.value })}/></Field>
              <Field label="From"><input className="input" placeholder="LeadFlow AI <you@example.com>" value={email.smtpFrom || ''} onChange={(e) => setProvider('email', { smtpFrom: e.target.value })}/></Field>
              <label className="mt-8 flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={email.smtpSecure === true || email.smtpSecure === 'true'} onChange={(e) => setProvider('email', { smtpSecure: e.target.checked })}/> Use SMTPS/SSL</label>
            </div>}
            <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]"><input className="input" placeholder="test recipient email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)}/><button onClick={() => save('email')} className="btn-secondary"><Save size={16}/> Save</button>{email.method === 'gmail_oauth' && <button onClick={startGmailOAuth} className="btn-primary"><KeyRound size={16}/> Sign in Google</button>}<button onClick={() => test('email')} className="btn-secondary"><Send size={16}/> Send test</button></div>
            {health.email?.note && <p className="text-xs text-slate-500 dark:text-slate-400">{health.email.note} {health.email.from ? `From: ${health.email.from}` : ''}</p>}
          </div>
        </Card>

        <Card icon={MapPinned} title="Maps & business finding" status={{ connected: Boolean(search.googlePlacesApiKey || search.serperApiKey || search.braveSearchApiKey || search.bingSearchApiKey || search.enableOpenStreetMap !== false) }} subtitle="Use Google Places API, Serper, Brave, Bing, plus a free OpenStreetMap/Overpass fallback. No Google Maps HTML scraping.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Google Places API key"><input className="input" type="password" value={search.googlePlacesApiKey || ''} onChange={(e) => setProvider('search', { googlePlacesApiKey: e.target.value })}/></Field>
            <Field label="Serper API key"><input className="input" type="password" value={search.serperApiKey || ''} onChange={(e) => setProvider('search', { serperApiKey: e.target.value })}/></Field>
            <Field label="Brave Search API key"><input className="input" type="password" value={search.braveSearchApiKey || ''} onChange={(e) => setProvider('search', { braveSearchApiKey: e.target.value })}/></Field>
            <Field label="Bing Search API key"><input className="input" type="password" value={search.bingSearchApiKey || ''} onChange={(e) => setProvider('search', { bingSearchApiKey: e.target.value })}/></Field>
          </div>
          <label className="mt-4 flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={search.enableOpenStreetMap !== false} onChange={(e) => setProvider('search', { enableOpenStreetMap: e.target.checked })}/> Enable free OpenStreetMap/Overpass discovery</label>
          <div className="mt-4 grid gap-3 sm:grid-cols-3"><input className="input" value={searchTest.niche} onChange={(e) => setSearchTest({ ...searchTest, niche: e.target.value })}/><input className="input" value={searchTest.location} onChange={(e) => setSearchTest({ ...searchTest, location: e.target.value })}/><input className="input" value={searchTest.industry} onChange={(e) => setSearchTest({ ...searchTest, industry: e.target.value })}/></div>
          <div className="mt-4 flex flex-wrap gap-2"><button onClick={() => save('search')} className="btn-secondary"><Save size={16}/> Save</button><button onClick={() => test('search')} className="btn-primary"><MapPinned size={16}/> Test discovery</button></div>
          {searchResults.length > 0 && <div className="mt-4 max-h-60 overflow-auto rounded-3xl border border-slate-200 dark:border-white/10">{searchResults.map((r, i) => <div key={i} className="border-b border-slate-100 p-3 text-sm last:border-0 dark:border-white/10"><p className="font-bold">{r.name}</p><p className="text-xs text-slate-500">{r.provider} • {r.website || r.phone || r.address}</p></div>)}</div>}
        </Card>

        <Card icon={MessageCircle} title="WhatsApp" status={health.whatsapp} subtitle="Official Meta WhatsApp Cloud API for real sends. Without Meta credentials, LeadFlow uses real wa.me click-to-chat links, not unofficial automation.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Meta access token"><input className="input" type="password" value={whatsapp.whatsappAccessToken || ''} onChange={(e) => setProvider('whatsapp', { whatsappAccessToken: e.target.value })}/></Field>
            <Field label="Phone Number ID"><input className="input" value={whatsapp.whatsappPhoneNumberId || ''} onChange={(e) => setProvider('whatsapp', { whatsappPhoneNumberId: e.target.value })}/></Field>
            <Field label="Business number"><input className="input" placeholder="+234…" value={whatsapp.businessNumber || ''} onChange={(e) => setProvider('whatsapp', { businessNumber: e.target.value })}/></Field>
            <Field label="Optional validation URL"><input className="input" value={whatsapp.whatsappVerifyUrl || ''} onChange={(e) => setProvider('whatsapp', { whatsappVerifyUrl: e.target.value })}/></Field>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]"><input className="input" value={testPhone} onChange={(e) => setTestPhone(e.target.value)}/><button onClick={() => save('whatsapp')} className="btn-secondary"><Save size={16}/> Save</button><button onClick={() => test('whatsapp')} className="btn-primary"><MessageCircle size={16}/> Validate</button></div>
          {health.whatsapp?.note && <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{health.whatsapp.note}</p>}
        </Card>

        <Card icon={Bot} title="AI providers" status={{ connected: health.ai?.some?.((p) => ['online','configured'].includes(p.status)) }} subtitle="Configure Ollama, Groq, and HuggingFace from the site. Rule scoring remains built-in as a real deterministic fallback.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Ollama URL"><input className="input" value={ai.ollamaUrl || 'http://localhost:11434/api/generate'} onChange={(e) => setProvider('ai', { ollamaUrl: e.target.value })}/></Field>
            <Field label="Ollama model"><input className="input" value={ai.ollamaModel || 'llama3'} onChange={(e) => setProvider('ai', { ollamaModel: e.target.value })}/></Field>
            <Field label="Groq API key"><input className="input" type="password" value={ai.groqApiKey || ''} onChange={(e) => setProvider('ai', { groqApiKey: e.target.value })}/></Field>
            <Field label="Groq model"><input className="input" value={ai.groqModel || 'llama-3.1-8b-instant'} onChange={(e) => setProvider('ai', { groqModel: e.target.value })}/></Field>
            <Field label="HuggingFace token"><input className="input" type="password" value={ai.hfApiKey || ''} onChange={(e) => setProvider('ai', { hfApiKey: e.target.value })}/></Field>
            <Field label="HuggingFace model"><input className="input" value={ai.hfModel || 'mistralai/Mistral-7B-Instruct-v0.2'} onChange={(e) => setProvider('ai', { hfModel: e.target.value })}/></Field>
          </div>
          <div className="mt-4 flex flex-wrap gap-2"><button onClick={() => save('ai')} className="btn-secondary"><Save size={16}/> Save</button><button onClick={() => test('ai')} className="btn-primary"><PlugZap size={16}/> Test AI</button></div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">{health.ai?.map?.((p) => <div key={p.provider} className="rounded-2xl border border-slate-200 bg-white p-3 text-sm dark:border-white/10 dark:bg-slate-950"><div className="flex items-center gap-2 font-bold"><CheckCircle2 className={['online','configured'].includes(p.status) ? 'text-emerald-500' : 'text-slate-400'} size={16}/>{p.provider}</div><p className="mt-1 text-xs text-slate-500">{p.status} • {p.model}</p></div>)}</div>
        </Card>
      </div>

      <div className="glass-card p-5 text-sm leading-7 text-slate-500 dark:text-slate-400">
        <p className="font-bold text-slate-700 dark:text-slate-200">Reality check:</p>
        <p>Google Places and WhatsApp Cloud API are official real APIs but require your own Google/Meta accounts and may require billing or business approval. LeadFlow will not use unofficial WhatsApp Web automation or protected Google Maps scraping.</p>
      </div>
    </div>
  );
}
