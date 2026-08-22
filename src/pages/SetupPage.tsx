import { Link } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { CodeBlock } from '../components/CodeBlock'

// ─── Content data ───────────────────────────────────────────────────────────

const PREREQS = [
  { name: 'Node.js 20 or newer', note: 'Check with node -v. Download from nodejs.org if needed.' },
  { name: 'npm 10 or newer', note: 'Ships with Node. Check with npm -v.' },
  { name: 'Git', note: 'To clone the repository. Check with git --version.' },
  { name: 'A free Supabase account', note: 'Sign up at supabase.com — the free tier is enough to run everything.' },
  { name: 'Supabase CLI (via npx)', note: "Invoked as npx supabase …, so there's nothing to install — npx fetches it on first use." },
]

const ENV_VARS = [
  {
    name: 'VITE_SUPABASE_URL',
    required: true,
    desc: 'Your Supabase project URL, e.g. https://your-project-ref.supabase.co. Read by the browser-side client.',
  },
  {
    name: 'VITE_SUPABASE_ANON_KEY',
    required: true,
    desc: 'The public "anon" key. Safe to expose in the browser — row-level security policies protect your data, not the secrecy of this key.',
  },
  {
    name: 'VITE_APP_BASE_URL',
    required: false,
    desc: "Optional, hosted-instance only: sets the origin shown in the docs page's code samples for the hosted gateway (…/api/v1). Self-hosted installs don't need it — once the CLI setup below has run, your real gateway URL is https://<your-project-ref>.supabase.co/functions/v1/gateway.",
  },
]

const NEXT_STEPS = [
  {
    title: 'Provision your project with the CLI',
    description: 'On the Connections page, run the five Supabase CLI commands (login, link, db push, functions deploy, config push) and click "Create owner account & sign in". After that, the gateway lives permanently inside your Supabase project — this dashboard never needs to be open again.',
    to: '/dashboard/connections',
    label: 'Dashboard → Connections',
  },
  {
    title: 'Add your first provider key',
    description: 'Add an OpenAI, Groq, Gemini, or custom OpenAI-compatible key with a short label. That label becomes the routing prefix, e.g. openai-work/gpt-4o.',
    to: '/dashboard/keys',
    label: 'Dashboard → Provider Keys',
  },
  {
    title: 'Generate a platform key',
    description: 'Create the API key your applications use to call this gateway. Shown once — store it somewhere safe.',
    to: '/dashboard/settings',
    label: 'Dashboard → Settings → Platform Keys',
  },
]

// ─── Building blocks (styled after DocsPage / HowItWorks) ───────────────────

function StepHeader({ number, title }: { number: string; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 16 }}>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--color-amber)',
        }}
      >
        {number}
      </span>
      <h2 style={{ fontSize: 22 }}>{title}</h2>
    </div>
  )
}

function Callout({ children, accent = 'amber' }: { children: React.ReactNode; accent?: 'amber' | 'indigo' }) {
  return (
    <div
      style={{
        background: 'var(--color-surface-2)',
        border: '1px solid var(--color-border)',
        borderLeft: `3px solid ${accent === 'amber' ? 'var(--color-amber)' : 'var(--color-indigo)'}`,
        borderRadius: 'var(--radius-md)',
        padding: '16px 20px',
        marginTop: 20,
      }}
    >
      <p style={{ fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.7 }}>{children}</p>
    </div>
  )
}

// ─── Page ───────────────────────────────────────────────────────────────────

export function SetupPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main className="container" style={{ flex: 1, padding: '64px 24px 96px', maxWidth: 820 }}>
        {/* Header */}
        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-amber)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
          Self-hosting guide
        </p>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', marginBottom: 16 }}>
          Set up Keyroute on your own infrastructure
        </h1>
        <p style={{ fontSize: 16, color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: 48 }}>
          From a fresh clone to a working gateway in about ten minutes. Everything runs against
          your own Supabase project — your keys, your data, no one else's servers.
        </p>

        {/* Step 1 — Prerequisites */}
        <section id="prerequisites" style={{ marginBottom: 56 }}>
          <StepHeader number="01" title="Prerequisites" />
          <div className="surface-card" style={{ overflow: 'hidden' }}>
            {PREREQS.map((p, i, arr) => (
              <div
                key={p.name}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  padding: '14px 20px',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--color-border-muted)' : 'none',
                }}
              >
                <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)' }}>{p.name}</span>
                <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{p.note}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Step 2 — Clone & install */}
        <section id="clone" style={{ marginBottom: 56 }}>
          <StepHeader number="02" title="Clone the repo & install dependencies" />
          <CodeBlock
            language="bash"
            code={`git clone https://github.com/basavarajpatil660/the-keyroute-project.git
cd the-keyroute-project
npm install`}
          />
          <Callout>
            Replace the clone URL with your own fork or repository if you've pushed this template
            somewhere of your own.
          </Callout>
        </section>

        {/* Step 3 — Create a Supabase project */}
        <section id="supabase" style={{ marginBottom: 56 }}>
          <StepHeader number="03" title="Create a Supabase project" />
          <div style={{ fontSize: 15, color: 'var(--color-text-muted)', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p>
              Go to <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer">supabase.com/dashboard</a>{' '}
              and create a new project. Pick any name and region close to you — the free tier is fine.
            </p>
            <p>
              Once it finishes provisioning, open <strong style={{ color: 'var(--color-text-primary)' }}>Project Settings → API</strong>.
              You need three values from that page:
            </p>
          </div>
          <div className="surface-card" style={{ marginTop: 20, overflow: 'hidden' }}>
            {[
              { name: 'Project URL', desc: 'Looks like https://your-project-ref.supabase.co — goes into .env.local as VITE_SUPABASE_URL in the next step.' },
              { name: 'Project API keys → anon public', desc: 'Goes into .env.local as VITE_SUPABASE_ANON_KEY. Safe for the browser; protected by RLS.' },
              { name: 'Project API keys → service_role', desc: 'Not needed in .env.local — your gateway edge function gets its service credentials injected automatically. You will only paste this later on the Connections page if you use the optional "Connect" feature, where it is AES-encrypted via Vault before storage.' },
            ].map((row, i, arr) => (
              <div
                key={row.name}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '220px 1fr',
                  gap: 16,
                  padding: '13px 20px',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--color-border-muted)' : 'none',
                }}
              >
                <code style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--color-amber)' }}>{row.name}</code>
                <span style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{row.desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Step 4 — Environment variables */}
        <section id="env" style={{ marginBottom: 56 }}>
          <StepHeader number="04" title="Configure .env.local" />
          <p style={{ fontSize: 15, color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: 20 }}>
            Copy the example file, then fill in the two required values from the previous step
            (the optional one can be left as-is):
          </p>
          <CodeBlock language="bash" code={`cp .env.example .env.local`} />
          <div className="surface-card" style={{ marginTop: 20, overflow: 'hidden' }}>
            {ENV_VARS.map((v, i, arr) => (
              <div
                key={v.name}
                style={{
                  padding: '14px 20px',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--color-border-muted)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <code style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--color-indigo)' }}>
                    {v.name}
                  </code>
                  {!v.required && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: 'rgba(139, 148, 158, 0.12)',
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      Optional
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>{v.desc}</p>
              </div>
            ))}
          </div>
          <Callout accent="indigo">
            Variables prefixed <code>VITE_</code> are compiled into the browser bundle — never put a
            service role key behind a <code>VITE_</code> prefix.
          </Callout>
        </section>

        {/* Step 5 — Provision via CLI */}
        <section id="migrations" style={{ marginBottom: 56 }}>
          <StepHeader number="05" title="Provision your project with the Supabase CLI" />
          <p style={{ fontSize: 15, color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: 20 }}>
            The database schema lives as plain SQL in <code>supabase/migrations</code> — tables, RLS
            policies, encryption helpers, and the RPC functions the app and gateway rely on — and
            the gateway itself is a Deno function in <code>supabase/functions/gateway</code>. A few
            CLI commands provision both into your new project:
          </p>
          <CodeBlock
            language="bash"
            code={`# One-time: authenticate the CLI and link it to your project
npx supabase login
npx supabase link --project-ref your-project-ref

# Apply every migration in supabase/migrations, in order
npx supabase db push

# Deploy the always-on gateway edge function into your project
npx supabase functions deploy gateway --no-verify-jwt

# Push supabase/config.toml settings to your project
# (disables email confirmations — required by the silent owner account)
npx supabase config push`}
          />
          <Callout accent="indigo">
            No terminal on this machine? The same five commands are listed with copy buttons on the{' '}
            <strong style={{ color: 'var(--color-text-primary)' }}>Connections page</strong> of the
            dashboard.
          </Callout>
          <Callout>
            Migrations only (e.g. in CI) can also be pushed directly against a connection string,
            without linking:{' '}
            <code>npx supabase db push --db-url "postgresql://…"</code> from Settings → Database →
            Connection string.
          </Callout>
        </section>

        {/* Step 6 — Run it */}
        <section id="run" style={{ marginBottom: 56 }}>
          <StepHeader number="06" title="Start the dev server" />
          <CodeBlock language="bash" code={`npm run dev`} />
          <p style={{ fontSize: 15, color: 'var(--color-text-muted)', lineHeight: 1.7, marginTop: 20, marginBottom: 0 }}>
            Open <code>http://localhost:5173</code> — the landing page should render. There's no
            login form: the Connections page's <strong style={{ color: 'var(--color-text-primary)' }}>Create
            owner account &amp; sign in</strong> button provisions a silent owner account for this
            install (after the CLI steps above), so opening the{' '}
            <Link to="/dashboard">dashboard</Link> just works (or routes you to{' '}
            <Link to="/setup">setup</Link> if it hasn't run yet).
          </p>
          <Callout accent="indigo">
            The dashboard is a control panel only. Once you've run the CLI setup (the Connections
            page walks through every command), your gateway runs permanently inside your own Supabase
            project at{' '}
            <code>https://&lt;your-project-ref&gt;.supabase.co/functions/v1/gateway</code> — completely
            independent of this dev server or any other server staying open.
          </Callout>
        </section>

        {/* Step 7 — What next */}
        <section id="next-steps" style={{ marginBottom: 56 }}>
          <StepHeader number="07" title="What to do next" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {NEXT_STEPS.map(step => (
              <Link
                key={step.title}
                to={step.to}
                className="surface-card"
                style={{
                  display: 'block',
                  padding: '18px 22px',
                  textDecoration: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)' }}>{step.title}</h3>
                  <span style={{ color: 'var(--color-amber)', fontSize: 14, flexShrink: 0 }}>→</span>
                </div>
                <p style={{ fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.6, marginTop: 6, marginBottom: 8 }}>
                  {step.description}
                </p>
                <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-amber)' }}>{step.label}</code>
              </Link>
            ))}
          </div>
          <Callout accent="indigo">
            Want the dashboard reachable at a real URL instead of <code>localhost</code>? You can
            optionally deploy this repo's control-panel UI to any static host or serverless platform
            that can build and serve a Vite app (Netlify, Cloudflare Pages, Vercel, …) and set the{' '}
            <code>VITE_</code> variables from step 04 there instead of in <code>.env.local</code>.
            This hosts the dashboard only — the gateway itself is already permanently live inside your
            Supabase project at{' '}
            <code>https://&lt;your-project-ref&gt;.supabase.co/functions/v1/gateway</code>, no matter
            where — or whether — the dashboard is deployed.
          </Callout>
        </section>

        {/* Cross-link */}
        <section>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
              border: '1px solid var(--color-border-muted)',
              borderRadius: 'var(--radius-md)',
              padding: '16px 20px',
              background: 'var(--color-surface-2)',
            }}
          >
            <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>
              Already running? The full routing convention and API reference live in the docs.
            </p>
            <Link to="/docs" className="btn-ghost" style={{ padding: '8px 18px', fontSize: 14, flexShrink: 0 }}>
              Open the docs →
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
