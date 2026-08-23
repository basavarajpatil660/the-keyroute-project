import { Link } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { StepHeader, Callout } from './SetupPage'

// ─── Page ───────────────────────────────────────────────────────────────────

export function VercelSetupPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main className="container" style={{ flex: 1, padding: '64px 24px 96px', maxWidth: 820 }}>
        {/* Header */}
        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-amber)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
          Self-hosting guide · Deployment option 2
        </p>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', marginBottom: 16 }}>
          Host the dashboard on your own Vercel account
        </h1>
        <p style={{ fontSize: 16, color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: 48 }}>
          Deploying to your own Vercel account gives you a real HTTPS URL instead of localhost, so your
          dashboard is reachable from anywhere without keeping your own machine running. The gateway itself
          already runs permanently on Supabase either way — this only affects where the control panel (the
          dashboard) lives.
        </p>

        {/* Step 01 — Prerequisites */}
        <section id="prerequisites" style={{ marginBottom: 56 }}>
          <StepHeader number="01" title="Prerequisites" />
          <div className="surface-card" style={{ overflow: 'hidden' }}>
            {[
              {
                name: 'A Vercel account',
                note: 'The free ("Hobby") tier is enough. Sign up at vercel.com — a GitHub account makes this one click.',
              },
              {
                name: 'Your fork of the repo on GitHub, or the original repo',
                note: "Both are valid. Forking (github.com/basavarajpatil660/the-keyroute-project → Fork) lets you customize the code and pull upstream updates; connecting the original repo directly is faster but you can't change anything.",
              },
              {
                name: 'A configured Supabase project',
                note: 'Same as local setup — see steps 03–04 of the main guide if you haven\'t created one yet.',
              },
            ].map((p, i, arr) => (
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

        {/* Step 02 — Import into Vercel */}
        <section id="import" style={{ marginBottom: 56 }}>
          <StepHeader number="02" title="Import the project into Vercel" />
          <ol style={{ fontSize: 15, color: 'var(--color-text-muted)', lineHeight: 1.8, paddingLeft: 22, margin: '0 0 16px' }}>
            <li>Go to <a href="https://vercel.com/new" target="_blank" rel="noreferrer" style={{ color: 'var(--color-indigo)' }}>vercel.com/new</a>.</li>
            <li>Click <strong style={{ color: 'var(--color-text-primary)' }}>Import Git Repository</strong> and select your fork or the original repo.</li>
            <li>Vercel auto-detects it as a <strong style={{ color: 'var(--color-text-primary)' }}>Vite</strong> project and pre-fills the build settings.</li>
          </ol>
          <div className="surface-card" style={{ overflow: 'hidden' }}>
            {[
              { name: 'Framework preset', desc: 'Vite (auto-detected)' },
              { name: 'Build command', desc: 'npm run build' },
              { name: 'Output directory', desc: 'dist' },
              { name: 'Install command', desc: 'npm install' },
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
                <span style={{ fontSize: 13, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>{row.desc}</span>
              </div>
            ))}
          </div>
          <Callout>
            These should auto-fill correctly. Don't deploy yet — set the environment variables first
            (next step), so the first build already has what it needs.
          </Callout>
        </section>

        {/* Step 03 — Environment variables */}
        <section id="env" style={{ marginBottom: 56 }}>
          <StepHeader number="03" title="Set environment variables in Vercel" />
          <p style={{ fontSize: 15, color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: 20 }}>
            In the Vercel project's <strong style={{ color: 'var(--color-text-primary)' }}>Settings → Environment Variables</strong>,
            add these two before clicking Deploy:
          </p>
          <div className="surface-card" style={{ overflow: 'hidden' }}>
            {[
              { name: 'VITE_SUPABASE_URL', desc: 'Your Supabase project URL — e.g. https://your-project-ref.supabase.co.' },
              { name: 'VITE_SUPABASE_ANON_KEY', desc: 'Your Supabase anon key. Safe to expose in the browser; RLS protects the data, not key secrecy.' },
            ].map((row, i, arr) => (
              <div
                key={row.name}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '260px 1fr',
                  gap: 16,
                  padding: '14px 20px',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--color-border-muted)' : 'none',
                }}
              >
                <code style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--color-indigo)' }}>{row.name}</code>
                <span style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>{row.desc}</span>
              </div>
            ))}
          </div>
          <Callout accent="indigo">
            These are the exact same two values used in <code>.env.local</code> for local development.
            Pointing both local and Vercel at the same Supabase project is fine — they're just two views
            onto one instance. Using separate Supabase projects for each is equally valid; pick whichever
            suits how you like to organize things.
          </Callout>
        </section>

        {/* Step 04 — Deploy */}
        <section id="deploy" style={{ marginBottom: 56 }}>
          <StepHeader number="04" title="Deploy" />
          <p style={{ fontSize: 15, color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: 16 }}>
            Click <strong style={{ color: 'var(--color-text-primary)' }}>Deploy</strong>. Vercel installs
            dependencies, runs the build, and hands you a URL like{' '}
            <code style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>your-project-name.vercel.app</code>{' '}
            within a couple of minutes.
          </p>
          <Callout>
            The repo already includes a <code>vercel.json</code> with the SPA rewrite
            (<code>/index.html</code> for all non-<code>/api</code> routes), which is what lets React Router
            handle URLs like <code>/dashboard/connections</code> directly on Vercel. No extra configuration
            needed there.
          </Callout>
        </section>

        {/* Step 05 — Deploy Gateway */}
        <section id="deploy-gateway" style={{ marginBottom: 56 }}>
          <StepHeader number="05" title="Run Deploy Gateway from the new URL" />
          <p style={{ fontSize: 15, color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: 16 }}>
            Same as the local flow: go to{' '}
            <code style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>https://your-vercel-url/dashboard/connections</code>, paste
            a Supabase personal access token, and click Deploy Gateway. Everything provisions into your
            Supabase project exactly as described in the{' '}
            <Link to="/setup" style={{ color: 'var(--color-indigo)' }}>main setup guide</Link>.
          </p>
          <Callout accent="amber">
            <strong style={{ color: 'var(--color-amber)' }}>Already deployed locally against this same Supabase project?</strong>{' '}
            Skip this step entirely. Migrations aren't idempotent — running Deploy Gateway again will fail
            with "already exists" errors. Your gateway is already live; just start using the new Vercel URL
            as your dashboard. This step is only for a fresh Supabase project / first-time setup.
          </Callout>
        </section>

        {/* Step 06 — What's different */}
        <section id="whats-different" style={{ marginBottom: 56 }}>
          <StepHeader number="06" title="What's now different (spoiler: almost nothing)" />
          <p style={{ fontSize: 15, color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: 16 }}>
            Under <code>npm run dev</code>, the Deploy Gateway flow talks to same-origin{' '}
            <code>/api/*</code> endpoints served by a small middleware inside the Vite dev server. On
            Vercel, those same routes are handled by serverless functions that ship with this repo in{' '}
            <code>api/</code> (<code>management-proxy.ts</code>, <code>deploy-function-proxy.ts</code>,{' '}
            <code>auth-config-proxy.ts</code>). Both runtimes call the identical underlying forwarding
            logic — same behavior, same security properties, zero extra configuration on your side. This
            dual-runtime setup was verified working end-to-end during development.
          </p>
          <Callout accent="indigo">
            Either way — localhost or your Vercel URL — the dashboard is only ever a control panel. The
            gateway itself keeps running permanently inside your Supabase project at{' '}
            <code>https://&lt;your-project-ref&gt;.supabase.co/functions/v1/gateway</code>, no matter where
            (or whether) the dashboard is deployed.
          </Callout>
        </section>

        {/* Custom domain callout */}
        <section>
          <Callout accent="indigo">
            <strong style={{ color: 'var(--color-text-primary)' }}>Custom domain:</strong> if you'd like
            something nicer than <code>*.vercel.app</code>, Vercel supports adding your own domain under{' '}
            <strong style={{ color: 'var(--color-text-primary)' }}>Project Settings → Domains</strong>.
            Entirely optional — everything works fine on the default URL.
          </Callout>
        </section>

        {/* Cross-link back */}
        <section style={{ marginTop: 40 }}>
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
              Haven't done the base setup yet? Start with the main guide first.
            </p>
            <Link to="/setup" className="btn-ghost" style={{ padding: '8px 18px', fontSize: 14, flexShrink: 0 }}>
              ← Main setup guide
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
