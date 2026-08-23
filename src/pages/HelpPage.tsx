import { Link } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'

export function HelpPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main className="container" style={{ flex: 1, padding: '64px 24px 96px', maxWidth: 820 }}>
        {/* Header */}
        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-amber)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
          Help
        </p>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', marginBottom: 16 }}>
          What is this, exactly?
        </h1>
        <p style={{ fontSize: 16, color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
          Keyroute gives you one URL for all your AI providers. You paste in the API keys
          you already have (OpenAI, Groq, Gemini, or anything OpenAI-compatible), give each
          one a short label, and get back a single address that works with any existing
          AI SDK. To choose which key a request uses, you prefix the model name with its
          label &mdash; so switching providers or keys later means changing one word in
          your code, not reconfiguring anything. Your keys are encrypted before they're
          stored, and every request is logged so you can see what you spent and where.
        </p>

        {/* The one path */}
        <section style={{ marginTop: 56 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-indigo)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
            How it works
          </p>
          <h2 style={{ fontSize: 24, marginBottom: 12 }}>Self-host it into your own Supabase project</h2>
          <p style={{ fontSize: 15, color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
            One click deploys the whole gateway into <em>your</em> Supabase project as an
            always-on edge function. After that, the gateway runs entirely inside your own
            account &mdash; nothing runs on anyone else's servers, and closing this website,
            your terminal, or your laptop changes nothing. This dashboard is just a remote
            control: open it when you want to look at stats or manage keys; ignore it the
            rest of the time and the gateway keeps working.
          </p>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              flexWrap: 'wrap',
              marginTop: 20,
              padding: '16px 20px',
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <Link to="/dashboard/connections" className="btn-primary" style={{ fontSize: 14, flexShrink: 0 }}>
              Deploy Gateway →
            </Link>
            <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
              Connections page &rarr; &ldquo;Deploy Gateway&rdquo; &mdash; migrations plus the edge function, provisioned into your project.
            </span>
          </div>
        </section>

        {/* How to self-host */}
        <section style={{ marginTop: 56 }}>
          <h2 style={{ fontSize: 24, marginBottom: 16 }}>How to self-host</h2>
          <div className="surface-card" style={{ overflow: 'hidden' }}>
            {[
              {
                step: '1',
                title: 'Get the code & a free Supabase project',
                body: 'Clone the repo and npm install. Create a project at supabase.com — the free tier is enough for everything.',
              },
              {
                step: '2',
                title: 'Point the dashboard at your project',
                body: 'Copy .env.example to .env.local and fill in your project URL + anon key from Project Settings → API.',
              },
              {
                step: '3',
                title: 'Run the dashboard locally',
                body: 'npm run dev, then open http://localhost:5173/dashboard/connections.',
              },
              {
                step: '4',
                title: 'Click Deploy Gateway',
                body: 'Paste a Supabase personal access token once. Migrations run, the silent owner account is created, and the gateway edge function deploys into your project — permanently.',
              },
              {
                step: '5',
                title: 'Add keys & make requests',
                body: 'Add a provider key on the Keys page, generate a platform key in Settings, and point any OpenAI SDK at https://<your-project-ref>.supabase.co/functions/v1/gateway.',
              },
            ].map((row, i, arr) => (
              <div
                key={row.step}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '44px 1fr',
                  gap: 14,
                  padding: '16px 20px',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--color-border-muted)' : 'none',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--color-amber)',
                    paddingTop: 2,
                  }}
                >
                  {row.step}
                </span>
                <span>
                  <span style={{ display: 'block', fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 4 }}>
                    {row.title}
                  </span>
                  <span style={{ fontSize: 13.5, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>{row.body}</span>
                </span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 13, color: 'var(--color-text-faint)', marginTop: 20, lineHeight: 1.7 }}>
            The full walkthrough with every command and screenshot-level detail is on the{' '}
            <Link to="/setup" style={{ color: 'var(--color-indigo)' }}>setup page</Link>.
          </p>
        </section>

        {/* Cross-links */}
        <section style={{ marginTop: 56 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 16,
            }}
          >
            <Link to="/docs" className="surface-card" style={{ padding: '20px 24px', textDecoration: 'none', display: 'block' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 6 }}>Docs →</h3>
              <p style={{ fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                Routing convention, API reference, and code examples for calling your gateway.
              </p>
            </Link>
            <Link to="/setup" className="surface-card" style={{ padding: '20px 24px', textDecoration: 'none', display: 'block' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 6 }}>Setup guide →</h3>
              <p style={{ fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                Step-by-step technical walkthrough for running everything yourself, from a fresh clone.
              </p>
            </Link>
          </div>
          <p style={{ fontSize: 13, color: 'var(--color-text-faint)', marginTop: 20, lineHeight: 1.7 }}>
            This page is the plain-language overview. For commands, environment variables,
            and API details, use the links above.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  )
}
