import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

/**
 * How it works — redesigned.
 *
 * PREVIOUS VERSION: 3 structurally identical cards (circle badge + title +
 * description + visual block, repeated 3x in equal-width columns). The eye
 * glides over it because nothing differentiates card 1 from card 2 from
 * card 3 — same shape, same rhythm, just different words.
 *
 * THIS VERSION: an asymmetric bento layout instead of 3 equal boxes. Step 1
 * (the security/trust story — Keyroute's actual differentiator) is the
 * visual hero: tall, spans both rows on the left. Steps 2 and 3 stack on
 * the right, smaller. Step 3 gets a genuinely different visual language —
 * a live animated request flow — instead of another static code-style
 * panel, reusing the same indigo "packet" motion already established in
 * HeroRouteDemo/HeroNetworkBackground, so it reads as part of the same
 * visual system rather than a one-off effect.
 *
 * Numbered steps are kept (01/02/03) because this genuinely is a sequence
 * — connect, then add keys, then route — not decoration for its own sake.
 * They're rendered as a large ghost watermark per card rather than a small
 * badge circle, which doubles as this section's signature element.
 */

function Reveal({
  children,
  delay = 0,
  style,
}: {
  children: ReactNode
  delay?: number
  style?: CSSProperties
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`reveal${visible ? ' is-visible' : ''}`}
      style={{ ...style, ['--reveal-delay' as string]: `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  )
}

const PROVIDER_CHIPS = [
  { name: 'OpenAI' },
  { name: 'Google Gemini' },
  { name: 'Groq' },
  { name: 'Anthropic', note: 'coming soon' },
  { name: 'Custom' },
]

/** Large ghost-numeral watermark — this section's signature element. */
function StepNumeral({ n }: { n: number }) {
  return (
    <span
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: -6,
        right: 16,
        fontSize: 96,
        fontFamily: 'var(--font-display)',
        fontWeight: 800,
        lineHeight: 1,
        color: 'var(--color-indigo)',
        opacity: 0.07,
        letterSpacing: '-0.05em',
        userSelect: 'none',
        pointerEvents: 'none',
      }}
    >
      {String(n).padStart(2, '0')}
    </span>
  )
}

/** Step 3's visual — a live animated request flow, distinct in kind from
 * the static panels in steps 1 and 2. Reuses the indigo packet-motion
 * idiom from HeroRouteDemo/HeroNetworkBackground rather than inventing a
 * new effect, so it reads as the same design system. */
function LiveRouteFlow() {
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '18px 16px',
        background: 'var(--color-surface-2)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
      }}
    >
      <code
        style={{
          fontSize: 12,
          fontFamily: 'var(--font-mono)',
          color: 'var(--color-indigo)',
          fontWeight: 600,
          background: 'var(--color-surface-3, var(--color-surface))',
          padding: '4px 10px',
          borderRadius: 6,
          border: '1px solid var(--color-border)',
          flexShrink: 0,
        }}
      >
        openai-work/gpt-4o
      </code>

      <div style={{ position: 'relative', flex: 1, height: 2, minWidth: 32 }}>
        <div
          style={{
            position: 'absolute',
            inset: '0 0 0 0',
            height: 1,
            top: 0.5,
            background: 'var(--color-border)',
          }}
        />
        <div
          className="route-flow-packet"
          style={{
            position: 'absolute',
            top: -2.5,
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'var(--color-indigo)',
          }}
        />
      </div>

      <code
        style={{
          fontSize: 12,
          fontFamily: 'var(--font-mono)',
          color: 'var(--color-text-primary)',
          fontWeight: 600,
          background: 'var(--color-surface-3, var(--color-surface))',
          padding: '4px 10px',
          borderRadius: 6,
          border: '1px solid var(--color-border)',
          flexShrink: 0,
        }}
      >
        your OpenAI key
      </code>

      <style>{`
        @keyframes routeFlowPacket {
          0%   { left: 0%;   opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { left: 100%; opacity: 0; }
        }
        .route-flow-packet {
          animation: routeFlowPacket 2.2s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .route-flow-packet { animation: none; left: 50%; opacity: 1; }
        }
      `}</style>
    </div>
  )
}

export function BentoGrid() {
  return (
    <section className="section-alt" style={{ padding: '96px 0 112px' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-amber)', marginBottom: 16 }}>
            How it works
          </p>
          <h2 style={{ fontSize: 'clamp(28px, 5vw, 44px)', marginBottom: 16, lineHeight: 1.15 }}>
            One setup. Every provider. Zero plaintext.
          </h2>
          <p style={{ fontSize: 17, color: 'var(--color-text-muted)', maxWidth: 480, margin: '0 auto', lineHeight: 1.6 }}>
            Three steps, no infrastructure to run.
          </p>
        </div>

        <div
          className="how-it-works-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '1.3fr 1fr',
            gridTemplateRows: 'auto auto',
            gap: 20,
            maxWidth: 1000,
            margin: '0 auto',
          }}
        >
          {/* Step 1 — the visual hero. Spans both rows on the left. */}
          <Reveal delay={0} style={{ gridColumn: 1, gridRow: '1 / 3' }}>
            <div
              className="surface-card"
              style={{
                position: 'relative',
                overflow: 'hidden',
                height: '100%',
                padding: '32px 28px',
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
              }}
            >
              <StepNumeral n={1} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <h3 style={{ fontSize: 19, fontWeight: 700, marginBottom: 10, fontFamily: 'var(--font-display)' }}>
                  Connect your Supabase
                </h3>
                <p style={{ fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.65, maxWidth: 340 }}>
                  Project URL + service key. Keys encrypted via AES-256 in your own database, Vault-managed secrets, RLS-enforced isolation.
                </p>
              </div>

              <div
                style={{
                  position: 'relative',
                  zIndex: 1,
                  marginTop: 'auto',
                  padding: 18,
                  background: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 12,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-text-muted)',
                  lineHeight: 2,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-indigo)', flexShrink: 0 }} />
                  <span>Provider keys → AES-256 (pgcrypto)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-amber)', flexShrink: 0 }} />
                  <span>Service key → Vault encryption</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-green)', flexShrink: 0 }} />
                  <span>Decrypt in RPC → RLS per session</span>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Step 2 — top right, chip cloud. */}
          <Reveal delay={120} style={{ gridColumn: 2, gridRow: 1 }}>
            <div
              className="surface-card"
              style={{
                position: 'relative',
                overflow: 'hidden',
                height: '100%',
                padding: '24px 22px',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              <StepNumeral n={2} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, fontFamily: 'var(--font-display)' }}>
                  Add your provider keys
                </h3>
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                  Label each key. That label becomes the routing prefix.
                </p>
              </div>
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 'auto' }}>
                {PROVIDER_CHIPS.map(p => (
                  <span
                    key={p.name}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '4px 10px',
                      borderRadius: 16,
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-surface-2)',
                      fontSize: 11,
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--color-indigo)' }} />
                    {p.name}
                    {p.note && (
                      <span style={{ fontSize: 8, color: 'var(--color-text-faint)', fontStyle: 'italic' }}>({p.note})</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Step 3 — bottom right, live animated flow instead of another static panel. */}
          <Reveal delay={240} style={{ gridColumn: 2, gridRow: 2 }}>
            <div
              className="surface-card"
              style={{
                position: 'relative',
                overflow: 'hidden',
                height: '100%',
                padding: '24px 22px',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              <StepNumeral n={3} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, fontFamily: 'var(--font-display)' }}>
                  Route live requests
                </h3>
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                  One base URL. Prefix the model to pick a key.
                </p>
              </div>
              <div style={{ position: 'relative', zIndex: 1, marginTop: 'auto' }}>
                <LiveRouteFlow />
              </div>
            </div>
          </Reveal>
        </div>

        <style>{`
          @media (max-width: 700px) {
            .how-it-works-grid {
              grid-template-columns: 1fr !important;
              grid-template-rows: none !important;
            }
            .how-it-works-grid > div {
              grid-column: 1 !important;
              grid-row: auto !important;
            }
          }
        `}</style>
      </div>
    </section>
  )
}
