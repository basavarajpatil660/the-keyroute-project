import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'

export function TermsOfServicePage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main className="container" style={{ flex: 1, padding: '64px 24px 96px', maxWidth: 820 }}>
        {/* Header */}
        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-amber)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
          Legal
        </p>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', marginBottom: 16 }}>
          Terms of Service
        </h1>
        <p style={{ fontSize: 16, color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
          Keyroute is open-source software (MIT License) that you self-host. You run your own instance,
          against your own Supabase project, on infrastructure you control. The terms below cover that use.
        </p>

        {/* Self-hosted use */}
        <section style={{ marginTop: 56 }}>
          <h2 style={{ fontSize: 24, marginBottom: 12 }}>Your instance, your responsibility</h2>
          <p style={{ fontSize: 15, color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
            When you deploy Keyroute, you are solely responsible for your own Supabase project, your own
            compliance obligations (e.g. data protection law in your jurisdiction), and your own uptime.
          </p>
        </section>

        {/* Third-party providers */}
        <section style={{ marginTop: 56 }}>
          <h2 style={{ fontSize: 24, marginBottom: 12 }}>Third-party providers</h2>
          <p style={{ fontSize: 15, color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
            Keyroute routes requests to AI providers you configure with your own API keys. You are
            responsible for complying with each provider's own terms of service (OpenAI, Google, Groq,
            Anthropic, etc.) — Keyroute is a routing layer, not a party to those agreements.
          </p>
        </section>

        {/* No warranty */}
        <section style={{ marginTop: 56 }}>
          <h2 style={{ fontSize: 24, marginBottom: 12 }}>No warranty</h2>
          <p style={{ fontSize: 15, color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
            The software is provided "as is," without warranty of any kind, express or implied. To the
            maximum extent permitted by law, the maintainers are not liable for any damages arising from
            use of the software.
          </p>
        </section>

        {/* License */}
        <section style={{ marginTop: 56 }}>
          <h2 style={{ fontSize: 24, marginBottom: 12 }}>License</h2>
          <p style={{ fontSize: 15, color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
            The source code is licensed under the MIT License — see the{' '}
            <a
              href="https://github.com/basavarajpatil660/the-keyroute-project/blob/main/LICENSE"
              target="_blank"
              rel="noreferrer"
              style={{ color: 'var(--color-indigo)' }}
            >
              LICENSE file
            </a>{' '}
            in the repository for full terms.
          </p>
        </section>

        <p style={{ fontSize: 13, color: 'var(--color-text-faint)', marginTop: 56 }}>
          Last updated: August 23, 2026
        </p>
      </main>

      <Footer />
    </div>
  )
}
