const STEPS = [
  {
    number: '01',
    title: 'Connect your Supabase project',
    description:
      'Paste your Supabase project URL and service key once. Keyroute encrypts it using AES-256 via pgcrypto and stores only the ciphertext. Your credentials never leave your Supabase instance unencrypted.',
    snippet: {
      label: 'In your Keyroute dashboard',
      lines: [
        { type: 'comment', text: '# One-time setup — your credentials stay encrypted' },
        { type: 'key', text: 'project_url', value: 'https://abcdef.supabase.co' },
        { type: 'key', text: 'service_key', value: '••••••••••••••••••••' },
      ],
    },
  },
  {
    number: '02',
    title: 'Add provider keys with labels',
    description:
      'Add as many API keys as you need — multiple OpenAI keys, Groq, Gemini, or custom endpoints — each with a short label you choose. Labels become the routing prefix in your requests.',
    snippet: {
      label: 'Provider keys added',
      lines: [
        { type: 'badge', provider: 'OpenAI', label: 'openai-work', masked: 'sk-••••3f2a' },
        { type: 'badge', provider: 'OpenAI', label: 'openai-personal', masked: 'sk-••••9b1c' },
        { type: 'badge', provider: 'Groq', label: 'groq-fast', masked: 'gsk_••••9c1d' },
        { type: 'badge', provider: 'Gemini', label: 'gemini-pro', masked: 'AIza••••k8mR' },
      ],
    },
  },
  {
    number: '03',
    title: 'Call one URL, route to any key',
    description:
      'Use your Keyroute platform API key and base URL as a drop-in replacement for any provider SDK. Prefix the model name with your label to target a specific key, or skip the prefix when you only have one key for that provider.',
    snippet: {
      label: 'curl example',
      lines: [
        { type: 'curl', text: 'curl "$KEYROUTE_URL/chat/completions" \\' },
        { type: 'curl', text: '  -H "Authorization: Bearer $KEYROUTE_KEY" \\' },
        { type: 'string', text: '  -d \'{"model": "openai-work/gpt-4o", ...}\'' },
      ],
    },
  },
]

const PROVIDER_COLORS: Record<string, string> = {
  OpenAI: '#10a37f',
  Groq: '#f55036',
  Gemini: '#4285f4',
  Custom: '#8b949e',
}

export function HowItWorks() {
  return (
    <section className="section-alt" style={{ padding: '100px 0' }}>
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 72 }}>
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-amber)', marginBottom: 12 }}>
            How it works
          </p>
          <h2 style={{ fontSize: 'clamp(28px, 5vw, 44px)', marginBottom: 16 }}>
            Three genuine steps.
          </h2>
          <p style={{ fontSize: 17, color: 'var(--color-text-muted)', maxWidth: 520, margin: '0 auto' }}>
            This is the actual sequence — not padded. You'll be routing live requests in under five minutes.
          </p>
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {STEPS.map((step, i) => (
            <div
              key={step.number}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 48,
                alignItems: 'center',
                padding: '56px 0',
                borderTop: i === 0 ? 'none' : '1px solid var(--color-border)',
              }}
              className="how-it-works-step"
            >
              {/* Text side (alternates) */}
              <div style={{ order: i % 2 === 0 ? 0 : 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      fontWeight: 700,
                      color: 'var(--color-amber)',
                      background: 'rgba(240,165,0,0.1)',
                      border: '1px solid rgba(240,165,0,0.25)',
                      borderRadius: 6,
                      padding: '4px 10px',
                      letterSpacing: '0.08em',
                    }}
                  >
                    {step.number}
                  </span>
                  <div style={{ width: 24, height: 1, background: 'var(--color-border)' }} />
                </div>
                <h3 style={{ fontSize: 'clamp(20px, 3vw, 28px)', marginBottom: 16 }}>{step.title}</h3>
                <p style={{ fontSize: 15, color: 'var(--color-text-muted)', lineHeight: 1.7 }}>{step.description}</p>
              </div>

              {/* Snippet side */}
              <div style={{ order: i % 2 === 0 ? 1 : 0 }}>
                <div
                  className="surface-card"
                  style={{
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      padding: '10px 16px',
                      borderBottom: '1px solid var(--color-border)',
                      fontSize: 11,
                      color: 'var(--color-text-muted)',
                      fontFamily: 'var(--font-mono)',
                      background: 'var(--color-surface-2)',
                    }}
                  >
                    {step.snippet.label}
                  </div>
                  <div style={{ padding: '16px' }}>
                    {step.snippet.lines.map((line: any, li) => {
                      if (line.type === 'comment') {
                        return (
                          <p key={li} className="token-comment" style={{ fontFamily: 'var(--font-mono)', fontSize: 13, marginBottom: 8 }}>
                            {line.text}
                          </p>
                        )
                      }
                      if (line.type === 'key') {
                        return (
                          <p key={li} style={{ fontFamily: 'var(--font-mono)', fontSize: 13, marginBottom: 6, display: 'flex', gap: 8 }}>
                            <span className="token-variable">{line.text}</span>
                            <span style={{ color: 'var(--color-text-muted)' }}>:</span>
                            <span className="token-string">{line.value}</span>
                          </p>
                        )
                      }
                      if (line.type === 'badge') {
                        return (
                          <div
                            key={li}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '8px 12px',
                              borderRadius: 8,
                              background: 'var(--color-surface-2)',
                              border: '1px solid var(--color-border-muted)',
                              marginBottom: 6,
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span
                                style={{
                                  width: 7,
                                  height: 7,
                                  borderRadius: '50%',
                                  background: PROVIDER_COLORS[line.provider!] ?? '#8b949e',
                                }}
                              />
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--color-amber)', fontWeight: 600 }}>
                                {line.label}
                              </span>
                              <span style={{ fontSize: 11, color: 'var(--color-text-faint)' }}>({line.provider})</span>
                            </div>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-faint)' }}>
                              {line.masked}
                            </span>
                          </div>
                        )
                      }
                      if (line.type === 'curl' || line.type === 'string') {
                        return (
                          <p key={li} style={{ fontFamily: 'var(--font-mono)', fontSize: 12, marginBottom: 4, color: line.type === 'string' ? '#a5d6ff' : 'var(--color-text-muted)' }}>
                            {line.text}
                          </p>
                        )
                      }
                      return null
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .how-it-works-step {
            grid-template-columns: 1fr !important;
            gap: 28px !important;
          }
          .how-it-works-step > div {
            order: 0 !important;
          }
        }
      `}</style>
    </section>
  )
}
