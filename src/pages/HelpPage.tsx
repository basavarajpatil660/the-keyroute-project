import { Link } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'

const COMPARISON_ROWS = [
  {
    aspect: 'Who hosts the code',
    hosted: 'This project\u2019s maintainers, on their Vercel + Supabase accounts.',
    selfHosted: 'You \u2014 the gateway runs as an edge function inside your own Supabase project.',
  },
  {
    aspect: 'Who can see your data',
    hosted: 'Your provider keys are encrypted in a database controlled by the hosted operator; their infrastructure is in the loop for every request.',
    selfHosted: 'Only you. Everything lives in your Supabase project \u2014 keys, logs, usage stats.',
  },
  {
    aspect: 'Keeps working if you close your laptop?',
    hosted: 'Yes \u2014 it runs on someone else\u2019s always-on servers.',
    selfHosted: 'Yes \u2014 the gateway runs inside Supabase, which is always on. The dashboard is only needed to view stats or manage keys.',
  },
  {
    aspect: 'Pick it for',
    hosted: 'Kicking the tires in under a minute \u2014 no setup at all.',
    selfHosted: 'Anything real: privacy, control, production workloads, or just not depending on anyone else staying online.',
  },
]

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

        {/* Option A */}
        <section style={{ marginTop: 56 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-indigo)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
            Option A
          </p>
          <h2 style={{ fontSize: 24, marginBottom: 12 }}>Use the hosted instance</h2>
          <p style={{ fontSize: 15, color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
            The fastest way to try things out: connect your Supabase project from the
            dashboard, add a key, and start routing &mdash; nothing to install. The trade-off
            is that a third party's infrastructure sits between you and your providers:
            the gateway code runs on the maintainers' hosting, and requests pass through
            it. Fine for experimenting; think twice before sending production traffic
            through someone else's server.
          </p>
        </section>

        {/* Option B */}
        <section style={{ marginTop: 56 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-amber)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
            Option B
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

        {/* Comparison table */}
        <section style={{ marginTop: 56 }}>
          <h2 style={{ fontSize: 24, marginBottom: 16 }}>Which one should I pick?</h2>
          <div className="surface-card" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
              <thead>
                <tr>
                  {['', 'Hosted', 'Self-hosted'].map(h => (
                    <th
                      key={h}
                      style={{
                        textAlign: 'left',
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: h === 'Self-hosted' ? 'var(--color-amber)' : 'var(--color-text-faint)',
                        padding: '14px 18px',
                        borderBottom: '1px solid var(--color-border)',
                        background: 'var(--color-surface-2)',
                      }}
                    >
                      {h || '\u00A0'}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map(row => (
                  <tr key={row.aspect}>
                    <td style={{ padding: '14px 18px', borderBottom: '1px solid var(--color-border-muted)', fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                      {row.aspect}
                    </td>
                    <td style={{ padding: '14px 18px', borderBottom: '1px solid var(--color-border-muted)', fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.6, verticalAlign: 'top' }}>
                      {row.hosted}
                    </td>
                    <td style={{ padding: '14px 18px', borderBottom: '1px solid var(--color-border-muted)', fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.6, verticalAlign: 'top' }}>
                      {row.selfHosted}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
