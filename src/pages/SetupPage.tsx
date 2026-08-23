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
]

// ─── Building blocks (shared with VercelSetupPage) ──────────────────────────

export function StepHeader({ number, title }: { number: string; title: string }) {
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

export function Callout({ children, accent = 'amber' }: { children: React.ReactNode; accent?: 'amber' | 'indigo' }) {
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
          From a fresh clone to a working gateway in about ten minutes — no CLI commands needed.
          Everything runs against your own Supabase project — your keys, your data, no one else's servers.
        </p>

        {/* Step 01 — Prerequisites */}
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

        {/* Step 02 — Clone & install */}
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

        {/* Step 03 — Create a Supabase project */}
        <section id="supabase" style={{ marginBottom: 56 }}>
          <StepHeader number="03" title="Create a Supabase project" />
          <div style={{ fontSize: 15, color: 'var(--color-text-muted)', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p>
              Go to <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer">supabase.com/dashboard</a>{' '}
              and create a new project. Pick any name and region close to you — the free tier is fine.
              Wait until provisioning finishes (the green "Active" badge) before continuing.
            </p>
            <p>
              Once it finishes provisioning, open <strong style={{ color: 'var(--color-text-primary)' }}>Project Settings → API</strong>.
              You need these values from that page:
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

        {/* Step 04 — Environment variables */}
        <section id="env" style={{ marginBottom: 56 }}>
          <StepHeader number="04" title="Configure .env.local" />
          <p style={{ fontSize: 15, color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: 20 }}>
            Copy the example file, then fill in the two values from the previous step:
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

        {/* Step 05 — Start the dev server */}
        <section id="run" style={{ marginBottom: 56 }}>
          <StepHeader number="05" title="Start the dev server" />
          <CodeBlock language="bash" code={`npm run dev`} />
          <p style={{ fontSize: 15, color: 'var(--color-text-muted)', lineHeight: 1.7, marginTop: 20 }}>
            Open <code>http://localhost:5173</code> — the landing page should render. Leave this
            terminal running; the dev server is your dashboard's control panel for the next step.
          </p>
          <Callout accent="amber">
            <strong style={{ color: 'var(--color-amber)' }}>Important — where to navigate:</strong>{' '}
            Do not open <code>/dashboard</code> or <code>/dashboard/overview</code> yet — they require an
            existing session and won't show anything useful until you've completed the next step. Go
            directly to <code>/dashboard/connections</code> instead.
          </Callout>
          <Callout accent="indigo">
            Why: on a fresh install there is no signed-in owner yet, so those URLs immediately bounce
            you to this setup page. The Connections page is deliberately reachable without a session —
            it's where Deploy Gateway lives, and Deploy Gateway is what creates the session.
          </Callout>
        </section>

        {/* Step 06 — Deploy Gateway */}
        <section id="deploy-gateway" style={{ marginBottom: 56 }}>
          <StepHeader number="06" title="Deploy Gateway (one click)" />
          <div style={{ fontSize: 15, color: 'var(--color-text-muted)', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p>
              This single step provisions everything into your Supabase project — database schema,
              owner account, and the always-on gateway edge function. No terminal commands involved.
            </p>
            <ol style={{ margin: 0, paddingLeft: 22, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <li>
                Open{' '}
                <Link to="/dashboard/connections" style={{ color: 'var(--color-indigo)' }}>
                  http://localhost:5173/dashboard/connections
                </Link>{' '}
                and scroll to the <strong style={{ color: 'var(--color-text-primary)' }}>Deploy Gateway</strong> card.
              </li>
              <li>
                Create a Supabase personal access token:{' '}
                open{' '}
                <a href="https://supabase.com/dashboard/account/tokens" target="_blank" rel="noreferrer">
                  supabase.com/dashboard/account/tokens
                </a>
                , click <em>Generate new token</em>, give it any name, and copy the value (it starts with{' '}
                <code>sbp_</code>). This token can provision anything in your Supabase account, so treat
                it like a password.
              </li>
              <li>
                Paste the token into the <strong style={{ color: 'var(--color-text-primary)' }}>Supabase personal access token</strong>{' '}
                field. It is used once for this action and then discarded from memory immediately — it is
                never stored in the database, localStorage, sessionStorage, or any log, and it is sent
                nowhere except Supabase's own Management API.
              </li>
              <li>
                Make sure the project URL shown or entered on the page is your new project's URL (the
                same one you put in <code>.env.local</code>), then click{' '}
                <strong style={{ color: 'var(--color-text-primary)' }}>Deploy Gateway</strong>.
              </li>
            </ol>
            <p>
              Over the next ~30–60 seconds the button shows live progress while it: applies every SQL
              migration in <code>supabase/migrations</code> in order → enables email auto-confirm →
              silently creates this install's owner account and signs your browser in (no email, no
              login form) → deploys the gateway edge function → waits until the public endpoint answers.
            </p>
            <p>
              Success looks like a green confirmation box containing your live gateway URL —{' '}
              <code>https://&lt;your-project-ref&gt;.supabase.co/functions/v1/gateway</code> — with a{' '}
              <strong style={{ color: 'var(--color-text-primary)' }}>Copy</strong> button. From this point on
              the gateway runs permanently inside your own Supabase project; this dev server never needs
              to be open again for the gateway to work.
            </p>
          </div>
          <Callout accent="amber">
            <strong style={{ color: 'var(--color-amber)' }}>Deploy Gateway runs once per fresh project.</strong>{' '}
            The migrations are not idempotent — re-running them against a partially-provisioned project
            fails with "already exists" errors. If the deploy fails partway through, either reset the
            Supabase project (drop the tables and functions it created) or create a brand-new Supabase
            project and start this guide over from step 03 before clicking Deploy Gateway again.
          </Callout>
        </section>

        {/* Step 07 — Dashboard unlocked */}
        <section id="dashboard-unlocked" style={{ marginBottom: 56 }}>
          <StepHeader number="07" title="Now the whole dashboard works" />
          <p style={{ fontSize: 15, color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: 16 }}>
            Because Deploy Gateway created a real session for this browser, every dashboard route is now
            reachable — including the ones that bounced you earlier:
          </p>
          <div className="surface-card" style={{ overflow: 'hidden' }}>
            {[
              { path: '/dashboard/overview', what: 'Usage stats, request volume, and activity at a glance.' },
              { path: '/dashboard/keys', what: 'Add provider keys (step 08).' },
              { path: '/dashboard/usage', what: 'Per-request usage log with tokens and latency.' },
              { path: '/dashboard/settings', what: 'Platform keys, profile, danger zone (step 09).' },
              { path: '/dashboard/activity', what: 'Recent request activity feed.' },
            ].map((row, i, arr) => (
              <div
                key={row.path}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '240px 1fr',
                  gap: 16,
                  padding: '13px 20px',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--color-border-muted)' : 'none',
                }}
              >
                <Link to={row.path} style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--color-indigo)', textDecoration: 'none' }}>
                  {row.path}
                </Link>
                <span style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{row.what}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Step 08 — Provider key */}
        <section id="provider-key" style={{ marginBottom: 56 }}>
          <StepHeader number="08" title="Add your first provider key" />
          <p style={{ fontSize: 15, color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
            On the <Link to="/dashboard/keys" style={{ color: 'var(--color-indigo)' }}>Keys page</Link>, add an
            OpenAI, Groq, Gemini, or custom OpenAI-compatible API key with a short label. That label becomes
            the routing prefix your requests use — e.g. a key labeled <code>openai-work</code> is addressed
            as <code>openai-work/gpt-4o</code>. Keys are AES-encrypted via Vault inside your own Supabase
            project before storage; the plaintext is never readable by the application layer after upload.
          </p>
        </section>

        {/* Step 09 — Platform key */}
        <section id="platform-key" style={{ marginBottom: 56 }}>
          <StepHeader number="09" title="Generate a platform key" />
          <p style={{ fontSize: 15, color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
            On the <Link to="/dashboard/settings" style={{ color: 'var(--color-indigo)' }}>Settings page</Link>,
            generate a platform key under <strong style={{ color: 'var(--color-text-primary)' }}>Platform Keys</strong>.
            This is the API key your applications authenticate with (<code>pk_live_…</code>) — the gateway
            validates it against the database on every request. It is shown exactly once at creation;
            store it somewhere safe before leaving the page.
          </p>
        </section>

        {/* Step 10 — Test it */}
        <section id="test-it" style={{ marginBottom: 56 }}>
          <StepHeader number="10" title="Test it with a real request" />
          <p style={{ fontSize: 15, color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: 20 }}>
            Send a chat completion through your gateway using the platform key from step 09 and the
            label-prefixed model from step 08. The response shape is identical to OpenAI's chat completions API:
          </p>
          <CodeBlock
            language="bash"
            code={`curl https://<your-project-ref>.supabase.co/functions/v1/gateway \\
  -H "Authorization: Bearer pk_live_YOUR_PLATFORM_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "openai-work/gpt-4o-mini",
    "messages": [{ "role": "user", "content": "Hello!" }]
  }'`}
          />
          <Callout>
            Swap in your own project ref, platform key, and label/model pair. Point any OpenAI-compatible SDK
            at the same URL as its <code>base_url</code> and it just works — streaming included.
          </Callout>
        </section>

        {/* Step 11 — Optional: prefer the CLI? */}
        <section id="cli-alternative" style={{ marginBottom: 56 }}>
          <StepHeader number="11" title="Optional: prefer the CLI?" />
          <p style={{ fontSize: 15, color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: 16 }}>
            You don't need this. Deploy Gateway already applies every migration, provisions the owner
            account, and deploys the edge function automatically. But if you'd rather run migrations
            yourself with the Supabase CLI, here is the equivalent of what the button does:
          </p>
          <details
            style={{
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-surface-2)',
              padding: '14px 18px',
            }}
          >
            <summary style={{ cursor: 'pointer', fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Show the manual Supabase CLI commands
            </summary>
            <div style={{ marginTop: 16 }}>
              <CodeBlock
                language="bash"
                code={`npx supabase login
npx supabase link --project-ref your-project-ref
npx supabase db push`}
              />
              <Callout accent="indigo">
                Note: even with the CLI you still need the Connections page once — its Deploy Gateway card
                also flips email auto-confirm on and creates the silent owner account that unlocks the rest
                of the dashboard. And migrations are not idempotent: don't mix CLI pushes with Deploy
                Gateway retries against the same project (see step 06).
              </Callout>
            </div>
          </details>
        </section>

        {/* Step 12 — Optional: host remotely */}
        <section id="hosting" style={{ marginBottom: 56 }}>
          <StepHeader number="12" title="Optional: host the dashboard remotely instead of localhost" />
          <Callout accent="indigo">
            Want the dashboard reachable at a real URL instead of <code>localhost</code>? You can optionally
            deploy this repo's control-panel UI to your own Vercel account (or any static host that can
            build a Vite app) and set the <code>VITE_</code> variables from step 04 there instead of in{' '}
            <code>.env.local</code>. Both modes are first-class: locally, the dev server serves the /api
            proxy endpoints itself; hosted, the same endpoints run as serverless functions. This hosts the
            dashboard only — the gateway itself is already permanently live inside your Supabase project at{' '}
            <code>https://&lt;your-project-ref&gt;.supabase.co/functions/v1/gateway</code>, no matter where —
            or whether — the dashboard is deployed.
          </Callout>
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
              marginTop: 16,
            }}
          >
            <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>
              Full walkthrough with every click, build setting, and environment variable:
            </p>
            <Link to="/setup/vercel" className="btn-primary" style={{ padding: '8px 18px', fontSize: 14, flexShrink: 0 }}>
              See the full Vercel deployment guide →
            </Link>
          </div>
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
