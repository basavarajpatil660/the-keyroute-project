/**
 * TrustSection — Explains the zero-plaintext credential design.
 * This is deliberately not marketing copy — it explains the mechanism plainly.
 */

const TRUST_POINTS = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-amber)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    title: 'Your provider keys are AES-256 encrypted before storage',
    body: 'When you add an API key, it is encrypted client-side before being written to your own Supabase database. Keyroute uses pgcrypto\'s AES-256 encryption with a secret key stored in Supabase Vault — not in the application layer, not in our servers.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-indigo)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3"/>
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
        <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/>
      </svg>
    ),
    title: 'The ciphertext lives in your Supabase project, not ours',
    body: 'You connect your own Supabase project. That means the encrypted credentials are stored in your database, under your RLS policies, in your Supabase account. Keyroute holds only a reference to your project URL — it cannot decrypt anything without first authenticating against your project.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-amber)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
    title: 'Keys are decrypted in-flight, never logged or persisted',
    body: 'When a request routes through Keyroute, the relevant key is decrypted by a security-definer RPC function inside your Supabase instance, used for the single upstream call, then discarded. It is never written to Keyroute\'s servers, never logged in plaintext, and never cached beyond the request lifecycle.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-indigo)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    title: 'Row-Level Security enforces per-user isolation',
    body: 'Every table in the schema — connections, key labels, platform keys, usage logs — is protected by Supabase RLS policies. A Keyroute platform API key can only decrypt the credentials belonging to the authenticated user. There is no administrative bypass in the application layer.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-amber)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5l-3-3"/>
      </svg>
    ),
    title: 'Your Supabase service key is vault-protected',
    body: 'To connect Keyroute to your Supabase project, you provide a service key once. Keyroute stores it using Supabase Vault (a secret management layer separate from the main database), encrypted at rest. If our application database were compromised, vault secrets would not be readable in the same breach.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-indigo)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ),
    title: 'What Keyroute does see: routing metadata, not content',
    body: 'Keyroute\'s usage logs record: which key label was used, which model was called, token counts (if returned by the provider), latency, and whether the call succeeded. Request content — your prompts and completions — passes through and is not stored by Keyroute.',
  },
]

export function TrustSection() {
  return (
    <section
      className="section-alt"
      style={{
        padding: '100px 0',
        borderTop: '1px solid var(--color-border)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: 64, maxWidth: 640 }}>
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-indigo)', marginBottom: 12 }}>
            Why your own Supabase
          </p>
          <h2 style={{ fontSize: 'clamp(28px, 5vw, 44px)', marginBottom: 20 }}>
            Your API keys are never stored in plaintext on our servers.
          </h2>
          <p style={{ fontSize: 17, color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
            This isn't a marketing claim — it's a structural constraint. Here's exactly how the credential storage works, without hedging.
          </p>
        </div>

        {/* Trust points grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 20,
          }}
        >
          {TRUST_POINTS.map((point, i) => (
            <div
              key={i}
              className="surface-card"
              style={{
                padding: '24px',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(129,140,248,0.4)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-border)'
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 12 }}>{point.icon}</div>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 15,
                  fontWeight: 700,
                  marginBottom: 10,
                  lineHeight: 1.4,
                  color: 'var(--color-text-primary)',
                }}
              >
                {point.title}
              </h3>
              <p style={{ fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
                {point.body}
              </p>
            </div>
          ))}
        </div>

        {/* Technical summary */}
        <div
          style={{
            marginTop: 40,
            padding: '24px',
            background: 'var(--color-surface-2)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            borderLeft: '3px solid var(--color-indigo)',
          }}
        >
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.7, maxWidth: 800 }}>
            <strong style={{ color: 'var(--color-text-primary)' }}>Technical summary:</strong>{' '}
            Provider API keys → AES-256 encrypted by pgcrypto → stored in your Supabase DB.
            Your Supabase service key → encrypted by Supabase Vault → stored separately from the main DB.
            Decryption happens inside Supabase security-definer RPC functions, scoped to your user session.
            Keyroute never receives or stores a plaintext credential on its own infrastructure.
          </p>
        </div>
      </div>
    </section>
  )
}
