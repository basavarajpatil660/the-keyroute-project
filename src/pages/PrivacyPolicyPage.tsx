import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'

export function PrivacyPolicyPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main className="container" style={{ flex: 1, padding: '64px 24px 96px', maxWidth: 820 }}>
        {/* Header */}
        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-amber)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
          Legal
        </p>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', marginBottom: 16 }}>
          Privacy Policy
        </h1>
        <p style={{ fontSize: 16, color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
          Keyroute is self-hosted software. You run your own instance against your own Supabase project,
          and every piece of data Keyroute touches lives in that project — under your account, in your
          chosen region. The maintainers have no access to it, no visibility into it, and no copy of it
          anywhere.
        </p>

        {/* What is stored */}
        <section style={{ marginTop: 56 }}>
          <h2 style={{ fontSize: 24, marginBottom: 12 }}>What is stored</h2>
          <p style={{ fontSize: 15, color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
            Your instance stores only two kinds of data, both inside your own Supabase project:
          </p>
          <ul style={{ fontSize: 15, color: 'var(--color-text-muted)', lineHeight: 1.9, paddingLeft: 22, margin: '12px 0' }}>
            <li>
              <strong style={{ color: 'var(--color-text-primary)' }}>Encrypted secrets:</strong> your provider
              API keys and any Supabase connection details, AES-256 encrypted via Supabase Vault. Only a
              security-definer function inside your database can decrypt them — not the application layer.
            </li>
            <li>
              <strong style={{ color: 'var(--color-text-primary)' }}>Usage metadata</strong> per request:
              model name, token counts, latency, and HTTP status.
            </li>
          </ul>
          <p style={{ fontSize: 15, color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
            The content of your prompts and the AI's responses is <strong style={{ color: 'var(--color-text-primary)' }}>not</strong> stored.
            That content passes through to your configured provider and is never logged or read by Keyroute.
          </p>
        </section>

        {/* Where your requests go */}
        <section style={{ marginTop: 56 }}>
          <h2 style={{ fontSize: 24, marginBottom: 12 }}>Where your requests go</h2>
          <p style={{ fontSize: 15, color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
            When you make a request through the gateway, your prompt is forwarded directly to whichever AI
            provider you've configured — OpenAI, Groq, Gemini, Anthropic, or a custom endpoint — using your
            own API key for that provider. Keyroute is a routing layer; it never sits on your content. That
            provider's own privacy policy governs how they handle your prompt content.
          </p>
        </section>

        {/* No tracking */}
        <section style={{ marginTop: 56 }}>
          <h2 style={{ fontSize: 24, marginBottom: 12 }}>No tracking</h2>
          <p style={{ fontSize: 15, color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
            No third-party analytics, ad trackers, or behavioral tracking of any kind are built into
            Keyroute. Nothing about you or your usage is reported to the maintainers or anyone else.
          </p>
        </section>

        {/* Deleting your data */}
        <section style={{ marginTop: 56 }}>
          <h2 style={{ fontSize: 24, marginBottom: 12 }}>Deleting your data</h2>
          <div className="surface-card" style={{ padding: '18px 22px', marginTop: 4 }}>
            <p style={{ fontSize: 15, color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
              You can delete your account and all associated data at any time from{' '}
              <strong style={{ color: 'var(--color-text-primary)' }}>Settings → Danger zone</strong>. This is
              immediate and permanent. Since everything lives in your own Supabase project, you can also
              delete the entire project whenever you like.
            </p>
          </div>
        </section>

        {/* Contact */}
        <section style={{ marginTop: 56 }}>
          <h2 style={{ fontSize: 24, marginBottom: 12 }}>Contact</h2>
          <p style={{ fontSize: 15, color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
            For any privacy questions, email{' '}
            <a href="mailto:hello@basavaraj.dev" style={{ color: 'var(--color-indigo)' }}>hello@basavaraj.dev</a>.
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
