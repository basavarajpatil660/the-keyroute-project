import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { TabbedCode } from '../components/CodeBlock'

// ─── Deployment modes ───────────────────────────────────────────────────────
// Keyroute runs two ways: a deployed copy maintained by the project's
// hosts ("hosted"), or your own self-hosted gateway living inside your
// own Supabase project as an edge function.
// Every base URL and code sample below reacts to this toggle.

type DeployMode = 'hosted' | 'local'

const DEPLOYED_ORIGIN = (import.meta.env.VITE_APP_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '')

const BASE_URLS: Record<DeployMode, string> = {
  hosted: `${DEPLOYED_ORIGIN}/api/v1`,
  local: 'https://your-project-ref.supabase.co/functions/v1/gateway',
}

const DEPLOY_LABELS: Record<DeployMode, string> = {
  hosted: 'Hosted instance',
  local: 'Self-hosted / local',
}

// ─── Code examples (generated per deploy mode) ─────────────────────────────

function getQuickstartExamples(baseUrl: string) {
  return [
    {
      label: 'curl',
      language: 'bash',
      code: `# Replace with your Keyroute platform key from Settings → Platform Keys
export KEYROUTE_KEY="pk_live_your_platform_key"
export KEYROUTE_URL="${baseUrl}"

curl "$KEYROUTE_URL/chat/completions" \\
  -H "Authorization: Bearer $KEYROUTE_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "openai-work/gpt-4o",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`,
    },
    {
      label: 'Python',
      language: 'python',
      code: `from openai import OpenAI

# Point the OpenAI client at Keyroute — works because we're OpenAI-compatible
client = OpenAI(
    api_key="pk_live_your_platform_key",      # your Keyroute platform key
    base_url="${baseUrl}"
)

# Prefix the model string with your label to route to that key
response = client.chat.completions.create(
    model="openai-work/gpt-4o",          # routes to the key labelled "openai-work"
    messages=[{"role": "user", "content": "Hello!"}]
)

print(response.choices[0].message.content)`,
    },
    {
      label: 'Node.js',
      language: 'javascript',
      code: `import OpenAI from 'openai';

// Drop-in replacement: just change apiKey and baseURL
const client = new OpenAI({
  apiKey: 'pk_live_your_platform_key',
  baseURL: '${baseUrl}',
});

// Label prefix routes to the exact key you want
const response = await client.chat.completions.create({
  model: 'openai-work/gpt-4o',
  messages: [{ role: 'user', content: 'Hello!' }],
});

console.log(response.choices[0].message.content);`,
    },
  ]
}

function getRoutingExamples(baseUrl: string) {
  return [
    {
      label: 'curl',
      language: 'bash',
      code: `export KEYROUTE_URL="${baseUrl}"

# Target a specific labeled key
# Format: {label}/{model}
curl "$KEYROUTE_URL/chat/completions" \\
  -H "Authorization: Bearer $KEYROUTE_KEY" \\
  -d '{"model": "openai-work/gpt-4o", ...}'

# Different label, same provider
curl "$KEYROUTE_URL/chat/completions" \\
  -H "Authorization: Bearer $KEYROUTE_KEY" \\
  -d '{"model": "openai-personal/gpt-4o-mini", ...}'

# Groq, targeting a specific key
curl "$KEYROUTE_URL/chat/completions" \\
  -H "Authorization: Bearer $KEYROUTE_KEY" \\
  -d '{"model": "groq-fast/llama-3.3-70b", ...}'

# Custom / OpenAI-compatible provider (e.g. Mistral) — set the key's
# provider to "custom" with a base URL when you add it in the dashboard
curl "$KEYROUTE_URL/chat/completions" \\
  -H "Authorization: Bearer $KEYROUTE_KEY" \\
  -d '{"model": "mistral-1/mistral-small-latest", "stream": true, ...}'

# Auto-detect: only one key registered? skip the prefix entirely
curl "$KEYROUTE_URL/chat/completions" \\
  -H "Authorization: Bearer $KEYROUTE_KEY" \\
  -d '{"model": "gpt-4o", ...}'`,
    },
    {
      label: 'Python',
      language: 'python',
      code: `from openai import OpenAI

client = OpenAI(
    api_key="pk_live_your_platform_key",
    base_url="${baseUrl}"
)

# Route to a specific labeled key
response = client.chat.completions.create(
    model="openai-work/gpt-4o",
    messages=[{"role": "user", "content": "Hello!"}]
)

# Auto-detect (only works when you have exactly one key registered total)
response = client.chat.completions.create(
    model="gpt-4o",   # Keyroute auto-routes to your single key
    messages=[{"role": "user", "content": "Hello!"}]
)

# Custom / OpenAI-compatible provider (e.g. Mistral) via a "custom" key
response = client.chat.completions.create(
    model="mistral-1/mistral-small-latest",
    messages=[{"role": "user", "content": "Hello!"}],
    stream=True
)`,
    },
    {
      label: 'Node.js',
      language: 'javascript',
      code: `import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: 'pk_live_your_platform_key',
  baseURL: '${baseUrl}',
});

// Route to a specific labeled key
await client.chat.completions.create({
  model: 'openai-work/gpt-4o',
  messages: [{ role: 'user', content: 'Hello!' }],
});

// Auto-detect: omit the prefix if you only have one key registered total
await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello!' }],
});

// Custom / OpenAI-compatible provider (e.g. Mistral) via a "custom" key
const stream = await client.chat.completions.create({
  model: 'mistral-1/mistral-small-latest',
  messages: [{ role: 'user', content: 'Hello!' }],
  stream: true,
});`,
    },
  ]
}

const SELF_HOST_EXAMPLES = [
  {
    label: 'Clone & install',
    language: 'bash',
    code: `git clone https://github.com/basavarajpatil660/the-keyroute-project.git
cd the-keyroute-project
npm install`,
  },
  {
    label: '.env setup',
    language: 'bash',
    code: `# .env.local — this is YOUR project, not anyone else's hosted one.
# Copy the example file, then fill in your own Supabase values from
# Project Settings → API in your Supabase dashboard.
cp .env.example .env.local

# Browser-side client (must be prefixed with VITE_)
VITE_SUPABASE_URL="https://your-project-ref.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"

# That's all — the gateway edge function gets SUPABASE_URL and
# SUPABASE_SERVICE_ROLE_KEY injected by Supabase automatically.`,
  },
  {
    label: 'Run locally',
    language: 'bash',
    code: `# Applies the SQL migrations + deploys the gateway edge function into
# YOUR Supabase project — or just click "Deploy Gateway" on the
# Connections page, which does both via the Supabase Management API.
npx supabase db push

# Starts the local dashboard (control panel only)
npm run dev
# → dashboard on http://localhost:5173
# → your gateway lives permanently at
#   https://<your-project-ref>.supabase.co/functions/v1/gateway
#   (independent of the dashboard being open)`,
  },
]

// ─── Sidebar nav structure ──────────────────────────────────────────────────

const DOC_SECTIONS = [
  { id: 'quickstart', label: 'Quickstart' },
  { id: 'self-hosting', label: 'Self-hosting' },
  { id: 'routing', label: 'Routing Convention' },
  { id: 'auto-detect', label: 'Auto-detection' },
  { id: 'api-reference', label: 'API Reference' },
]

export function DocsPage() {
  const [activeSection, setActiveSection] = useState('quickstart')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [deployMode, setDeployMode] = useState<DeployMode>('hosted')

  const baseUrl = BASE_URLS[deployMode]
  const quickstartExamples = getQuickstartExamples(baseUrl)
  const routingExamples = getRoutingExamples(baseUrl)

  const scrollTo = (id: string) => {
    setActiveSection(id)
    setMobileNavOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <div style={{ flex: 1, display: 'flex', position: 'relative' }}>
        {/* Sidebar */}
        <aside
          style={{
            width: 220,
            flexShrink: 0,
            borderRight: '1px solid var(--color-border-muted)',
            padding: '32px 0',
            position: 'sticky',
            top: 64,
            height: 'calc(100vh - 64px)',
            overflowY: 'auto',
          }}
          className="docs-sidebar"
        >
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 20px', marginBottom: 10 }}>
            Documentation
          </p>
          <nav>
            {DOC_SECTIONS.map(s => (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 20px',
                  fontSize: 14,
                  color: activeSection === s.id ? 'var(--color-amber)' : 'var(--color-text-muted)',
                  background: activeSection === s.id ? 'var(--color-amber-glow)' : 'transparent',
                  borderLeft: activeSection === s.id ? '2px solid var(--color-amber)' : '2px solid transparent',
                  border: 'none',
                  borderRight: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  fontWeight: activeSection === s.id ? 600 : 400,
                  transition: 'all 0.15s ease',
                }}
              >
                {s.label}
              </button>
            ))}
          </nav>

          {/* Deploy mode toggle — sticks with you as you scroll the sidebar */}
          <div style={{ padding: '20px 20px 0', marginTop: 20, borderTop: '1px solid var(--color-border-muted)' }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              I'm running
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(['hosted', 'local'] as DeployMode[]).map(mode => (
                <button
                  key={mode}
                  onClick={() => setDeployMode(mode)}
                  style={{
                    textAlign: 'left',
                    padding: '7px 10px',
                    fontSize: 13,
                    borderRadius: 6,
                    border: '1px solid ' + (deployMode === mode ? 'rgba(240,165,0,0.4)' : 'var(--color-border-muted)'),
                    background: deployMode === mode ? 'var(--color-amber-glow)' : 'transparent',
                    color: deployMode === mode ? 'var(--color-amber)' : 'var(--color-text-muted)',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                    fontWeight: deployMode === mode ? 600 : 400,
                  }}
                >
                  {DEPLOY_LABELS[mode]}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Mobile nav toggle */}
        <button
          className="docs-mobile-nav-btn"
          onClick={() => setMobileNavOpen(v => !v)}
          style={{
            display: 'none',
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 50,
            background: 'var(--color-amber)',
            color: 'var(--color-amber-btn-text)',
            border: 'none',
            borderRadius: 40,
            padding: '10px 18px',
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            boxShadow: 'var(--shadow-glow-amber)',
          }}
        >
          {mobileNavOpen ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="3" y1="3" x2="13" y2="13" />
                <line x1="13" y1="3" x2="3" y2="13" />
              </svg>
              Close
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="2" y1="4" x2="14" y2="4" />
                <line x1="2" y1="8" x2="14" y2="8" />
                <line x1="2" y1="12" x2="14" y2="12" />
              </svg>
              Contents
            </span>
          )}
        </button>

        {/* Mobile nav drawer */}
        {mobileNavOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.7)',
              zIndex: 40,
              display: 'flex',
              alignItems: 'flex-end',
            }}
            onClick={() => setMobileNavOpen(false)}
          >
            <div
              style={{
                background: 'var(--color-surface)',
                width: '100%',
                padding: '24px 20px 40px',
                borderTop: '1px solid var(--color-border)',
                borderRadius: '20px 20px 0 0',
              }}
              onClick={e => e.stopPropagation()}
            >
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
                Jump to
              </p>
              {DOC_SECTIONS.map(s => (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '12px 0',
                    fontSize: 16,
                    color: 'var(--color-text-primary)',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px solid var(--color-border-muted)',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {s.label}
                </button>
              ))}

              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '20px 0 12px' }}>
                I'm running
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['hosted', 'local'] as DeployMode[]).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setDeployMode(mode)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      fontSize: 13,
                      borderRadius: 8,
                      border: '1px solid ' + (deployMode === mode ? 'rgba(240,165,0,0.4)' : 'var(--color-border-muted)'),
                      background: deployMode === mode ? 'var(--color-amber-glow)' : 'transparent',
                      color: deployMode === mode ? 'var(--color-amber)' : 'var(--color-text-muted)',
                      cursor: 'pointer',
                      fontWeight: deployMode === mode ? 600 : 400,
                    }}
                  >
                    {DEPLOY_LABELS[mode]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <main style={{ flex: 1, padding: '48px 48px 80px', maxWidth: 760 }} className="docs-content">

          {/* ─ Quickstart ─ */}
          <section id="quickstart" style={{ marginBottom: 80 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-amber)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
              Quickstart
            </p>
            <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', marginBottom: 16 }}>
              Up and running in five minutes
            </h1>
            <p style={{ fontSize: 16, color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: 20 }}>
              Keyroute is drop-in compatible with the OpenAI client SDK and any HTTP client. You point your existing code at a new base URL, swap your API key for your Keyroute platform key, and prefix the model name with the label of the key you want to use.
            </p>

            {/* Inline mode banner, in case someone lands mid-page from a link */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: 13,
                color: 'var(--color-text-muted)',
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border-muted)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                marginBottom: 32,
              }}
            >
              <span>Showing examples for:</span>
              <strong style={{ color: 'var(--color-amber)' }}>{DEPLOY_LABELS[deployMode]}</strong>
              <span style={{ color: 'var(--color-text-faint)' }}>·</span>
              <code style={{ color: 'var(--color-text-faint)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{baseUrl}</code>
              <span style={{ color: 'var(--color-text-faint)' }}>(switch in the sidebar)</span>
            </div>

            <h2 style={{ fontSize: 20, marginBottom: 12 }}>Step 1 — Connect your Supabase project</h2>
            <p style={{ fontSize: 15, color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: 24 }}>
              {deployMode === 'hosted' ? (
                <>
                  Open the <Link to="/dashboard/connections">dashboard</Link> and paste your Supabase project URL and service key. This is a one-time step. Keyroute encrypts the service key using Supabase Vault and stores only the ciphertext — it is never accessible in plaintext from our servers.
                </>
              ) : (
                <>
                  Create your own free Supabase project, then run the migrations in <code>supabase/migrations</code> against it (see the <a href="#self-hosting">Self-hosting</a> section below for exact commands). Everything — your data, your keys, your vault secrets — lives entirely in your own Supabase project. Nothing is shared with the hosted Keyroute instance.
                </>
              )}
            </p>

            <h2 style={{ fontSize: 20, marginBottom: 12 }}>Step 2 — Add provider keys</h2>
            <p style={{ fontSize: 15, color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: 24 }}>
              Navigate to <Link to="/dashboard/keys">Provider Keys</Link> and add your API key for each provider. Give each key a short, memorable label — this becomes the routing prefix. Example labels: <code>openai-work</code>, <code>openai-personal</code>, <code>groq-fast</code>, <code>gemini-pro</code>.
            </p>

            <h2 style={{ fontSize: 20, marginBottom: 12 }}>Step 3 — Get your platform key</h2>
            <p style={{ fontSize: 15, color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: 24 }}>
              Go to <Link to="/dashboard/settings">Settings → Platform Keys</Link> and generate a new platform key. This is the key your application uses to call Keyroute. It is shown once — save it. It authenticates requests to Keyroute and never touches your provider keys directly.
            </p>

            <h2 style={{ fontSize: 20, marginBottom: 16 }}>Step 4 — Make your first routed call</h2>
            <TabbedCode examples={quickstartExamples} />
          </section>

          {/* ─ Self-hosting ─ */}
          <section id="self-hosting" style={{ marginBottom: 80 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-amber)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
              Self-hosting
            </p>
            <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 34px)', marginBottom: 16 }}>
              Run your own copy, fully under your control
            </h2>
            <p style={{ fontSize: 16, color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: 24 }}>
              Keyroute is open source. You can clone the repo, point it at your own Supabase project, and run the whole thing on your own infrastructure — no dependency on anyone else's servers. No data ever passes through infrastructure you don't control.
            </p>

            <div
              style={{
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                borderLeft: '3px solid var(--color-amber)',
                borderRadius: 'var(--radius-md)',
                padding: '16px 20px',
                marginBottom: 28,
              }}
            >
              <p style={{ fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
                <strong style={{ color: 'var(--color-text-primary)' }}>Why self-host:</strong>{' '}
                Full control over your own data, no reliance on any third party staying online, and you can read every line of code handling your provider keys. This is the intended long-term way to run Keyroute — the hosted version is really just a convenience for trying it out.
              </p>
            </div>

            <TabbedCode examples={SELF_HOST_EXAMPLES} />

            <p style={{ fontSize: 15, color: 'var(--color-text-muted)', lineHeight: 1.7, marginTop: 24 }}>
              Once running, everything else on this page — routing, auto-detection, the API reference — works exactly the same. The only difference is the base URL, which is why every code sample above can be toggled between <strong>Hosted</strong> and <strong>Self-hosted / local</strong> using the switch in the sidebar.
            </p>

            <p style={{ fontSize: 14, color: 'var(--color-text-faint)', lineHeight: 1.7, marginTop: 16 }}>
              Deploying your own instance publicly (rather than running it on localhost) works the same way — fork the repo, connect it to your own Vercel project, and set the same environment variables there instead of in <code>.env.local</code>.
            </p>
          </section>

          {/* ─ Routing Convention ─ */}
          <section id="routing" style={{ marginBottom: 80 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-amber)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
              Routing Convention
            </p>
            <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 34px)', marginBottom: 16 }}>
              Prefix-in-model-string routing
            </h2>
            <p style={{ fontSize: 16, color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: 24 }}>
              The routing format is <code style={{ color: 'var(--color-amber)', background: 'var(--color-amber-glow)', padding: '2px 6px', borderRadius: 4 }}>label/model</code>. The part before the slash is the key label you assigned in the dashboard. The part after the slash is the model name as the provider expects it. This is identical whether you're on the hosted instance or your own self-hosted one.
            </p>

            <div
              className="surface-card"
              style={{
                padding: '20px 24px',
                marginBottom: 28,
                fontFamily: 'var(--font-mono)',
                fontSize: 15,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ color: 'var(--color-amber)', fontWeight: 600 }}>openai-work</span>
                <span style={{ color: 'var(--color-text-faint)' }}>/</span>
                <span style={{ color: 'var(--color-indigo)' }}>gpt-4o</span>
                <span style={{ color: 'var(--color-text-faint)', fontSize: 13, marginLeft: 8 }}>↳ routes to the key labelled "openai-work"</span>
              </div>
            </div>

            <p style={{ fontSize: 15, color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: 24 }}>
              The slash delimiter is chosen to be compatible with the model string fields in OpenAI-compatible clients without requiring any SDK modification. The label portion is stripped by Keyroute before the request is forwarded to the provider.
            </p>

            <h3 style={{ fontSize: 18, marginBottom: 14 }}>Examples</h3>
            <div
              className="surface-card"
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 0,
                overflow: 'hidden',
                marginBottom: 28,
                fontSize: 13,
              }}
            >
              {[
                { model: 'openai-work/gpt-4o', routes: 'Key labelled "openai-work" → OpenAI' },
                { model: 'openai-personal/gpt-4o-mini', routes: 'Key labelled "openai-personal" → OpenAI' },
                { model: 'groq-fast/llama-3.3-70b', routes: 'Key labelled "groq-fast" → Groq' },
                { model: 'gemini-pro/gemini-1.5-flash', routes: 'Key labelled "gemini-pro" → Google' },
              ].map((row, i) => (
                <div
                  key={i}
                  style={{
                    padding: '12px 16px',
                    gridColumn: '1 / -1',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 16,
                    borderBottom: i < 3 ? '1px solid var(--color-border-muted)' : 'none',
                  }}
                >
                  <code style={{ color: 'var(--color-amber)', fontFamily: 'var(--font-mono)' }}>{row.model}</code>
                  <span style={{ color: 'var(--color-text-muted)' }}>{row.routes}</span>
                </div>
              ))}
            </div>

            <TabbedCode examples={routingExamples} />
          </section>

          {/* ─ Auto-detection ─ */}
          <section id="auto-detect" style={{ marginBottom: 80 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-amber)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
              Auto-detection
            </p>
            <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 34px)', marginBottom: 16 }}>
              Skip the prefix when you have one key
            </h2>
            <p style={{ fontSize: 16, color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: 20 }}>
              If you call Keyroute with a bare model name (no <code>/</code> prefix), the gateway checks whether you have exactly one active provider key registered <em>in total</em> — not one per provider. If so, it routes automatically to that key. If you have two or more active keys of any kind, the call is rejected with a <code>400</code> error and you must use a prefix to disambiguate.
            </p>

            <div
              style={{
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                borderLeft: '3px solid var(--color-indigo)',
                borderRadius: 'var(--radius-md)',
                padding: '16px 20px',
                marginBottom: 24,
              }}
            >
              <p style={{ fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
                <strong style={{ color: 'var(--color-text-primary)' }}>Auto-detect rule:</strong>{' '}
                Model string contains no <code>/</code> → Keyroute checks whether exactly one active key exists across your whole account → if so, routes to it, regardless of provider. If zero or multiple keys exist, it returns:
              </p>
              <p style={{ fontSize: 13, color: 'var(--color-text-faint)', fontFamily: 'var(--font-mono)', marginTop: 10, lineHeight: 1.6 }}>
                400 — "Could not resolve a provider key for that model. Prefix it with your key label, e.g. 'openai-work/gpt-4o' — or add exactly one provider key to skip the prefix."
              </p>
            </div>

            <p style={{ fontSize: 15, color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
              Auto-detection is intended as a convenience for simple setups — this is especially handy for a self-hosted instance that only you use, since you'll often have just one key of each provider registered. For anything with multiple keys, use explicit labels to keep routing deterministic and auditable in your usage logs.
            </p>
          </section>

          {/* ─ API Reference ─ */}
          <section id="api-reference" style={{ marginBottom: 80 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-amber)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
              API Reference
            </p>
            <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 34px)', marginBottom: 16 }}>
              Endpoints
            </h2>
            <p style={{ fontSize: 16, color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: 24 }}>
              Keyroute exposes an OpenAI-compatible API. Any client that works with the OpenAI REST API will work with Keyroute — just change the base URL and API key. Base URL ({DEPLOY_LABELS[deployMode]}): <code style={{ color: 'var(--color-amber)' }}>{baseUrl}</code>
            </p>

            <div
              className="surface-card"
              style={{
                overflow: 'hidden',
              }}
            >
              {[
                { method: 'POST', path: '/api/v1/chat/completions', desc: 'OpenAI-compatible chat completions. Supports streaming via "stream": true.', planned: false },
                { method: 'GET', path: '/api/v1/models', desc: 'List your registered key labels as pseudo-model prefixes.', planned: true },
                { method: 'GET', path: '/api/v1/health', desc: 'Health check endpoint. No auth required.', planned: true },
              ].map((ep, i, arr) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 16,
                    padding: '16px 20px',
                    borderBottom: i < arr.length - 1 ? '1px solid var(--color-border-muted)' : 'none',
                    opacity: ep.planned ? 0.55 : 1,
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: 4,
                      background: ep.method === 'POST' ? 'rgba(63,185,80,0.12)' : 'rgba(129,140,248,0.12)',
                      color: ep.method === 'POST' ? 'var(--color-green)' : 'var(--color-indigo)',
                      flexShrink: 0,
                    }}
                  >
                    {ep.method}
                  </span>
                  <div>
                    <code style={{ fontSize: 14, color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>{ep.path}</code>
                    {ep.planned && (
                      <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, color: 'var(--color-amber)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Planned — not live yet
                      </span>
                    )}
                    <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4, lineHeight: 1.5 }}>{ep.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <h3 style={{ fontSize: 18, margin: '32px 0 14px' }}>Supported providers</h3>
            <div
              className="surface-card"
              style={{ overflow: 'hidden', marginBottom: 24 }}
            >
              {[
                { provider: 'openai', status: 'Supported', note: 'Native OpenAI chat/completions.' },
                { provider: 'groq', status: 'Supported', note: 'Groq\'s OpenAI-compatible endpoint.' },
                { provider: 'gemini', status: 'Supported', note: "Google's OpenAI-compatibility layer." },
                { provider: 'custom', status: 'Supported', note: 'Any OpenAI-compatible endpoint — set a base URL when adding the key. This is how Mistral and similar providers are used today.' },
                { provider: 'anthropic', status: 'Not yet implemented', note: 'Selectable when adding a key, but requests currently return 501 — Anthropic\'s Messages API has a different shape and needs dedicated translation work.' },
              ].map((p, i, arr) => (
                <div
                  key={p.provider}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: '12px 20px',
                    borderBottom: i < arr.length - 1 ? '1px solid var(--color-border-muted)' : 'none',
                  }}
                >
                  <code style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--color-text-primary)', width: 90, flexShrink: 0 }}>{p.provider}</code>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: p.status === 'Supported' ? 'rgba(63,185,80,0.12)' : 'rgba(240,165,0,0.12)',
                      color: p.status === 'Supported' ? 'var(--color-green)' : 'var(--color-amber)',
                      flexShrink: 0,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {p.status}
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{p.note}</span>
                </div>
              ))}
            </div>

            <h3 style={{ fontSize: 18, marginBottom: 14 }}>Streaming</h3>
            <p style={{ fontSize: 15, color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: 16 }}>
              Set <code style={{ color: 'var(--color-amber)' }}>"stream": true</code> in your request body for real server-sent-event streaming — Keyroute forwards chunks to you as they arrive from the provider, not buffered. Token usage is captured from the provider's own final chunk when it reports one; if a provider doesn't report usage on streamed responses, Keyroute estimates prompt/completion tokens from the actual request and response text instead (shown with a <code>~</code> prefix in your Usage dashboard, clearly distinguished from real provider-reported numbers).
            </p>

            <div
              style={{
                marginTop: 24,
                padding: '16px 20px',
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border-muted)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <p style={{ fontSize: 14, color: 'var(--color-text-faint)' }}>
                Full reference documentation with request/response schemas is in progress. For now, treat Keyroute as a transparent proxy: the request body and response format match the provider's specification exactly, whether you're on the hosted instance or self-hosting.
              </p>
            </div>
          </section>

        </main>
      </div>

      <Footer />

      <style>{`
        @media (max-width: 768px) {
          .docs-sidebar { display: none !important; }
          .docs-mobile-nav-btn { display: block !important; }
          .docs-content { padding: 32px 20px 80px !important; max-width: 100% !important; }
        }
      `}</style>
    </div>
  )
}
