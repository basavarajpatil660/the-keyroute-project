import { Link } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { HeroRouteDemo } from '../components/HeroRouteDemo'
import { HeroNetworkBackground } from '../components/HeroNetworkBackground'
import { BentoGrid } from '../components/BentoGrid'
import { WhyKeyrouteSection, GetInvolvedSection } from '../components/WhyKeyrouteSection'
import { SectionDivider } from '../components/SectionDivider'

const TRUST_BADGES = [
  {
    label: 'Free forever',
    caption: 'No trial. No card required.',
  },
  {
    label: 'AES-256',
    caption: 'Keys encrypted before they leave your browser.',
  },
  {
    label: 'Your own Supabase',
    caption: 'Ciphertext lives in your project. Not ours.',
  },
  {
    label: '5+ providers',
    caption: 'OpenAI, Gemini, Groq, Anthropic, custom.',
  },
]

/**
 * HeroColumnDivider — vertical version of SectionDivider, run down the
 * seam between the hero's two columns (headline copy / routing demo).
 * Without it the two halves just float in open space with a gap and
 * nothing marking where one side ends and the other begins. Hidden on
 * mobile, where .hero-grid already collapses to a single column.
 */
function HeroColumnDivider() {
  return (
    <div
      aria-hidden="true"
      className="hero-column-divider"
      style={{
        position: 'absolute',
        left: '50%',
        top: 0,
        bottom: 0,
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    >
      <span
        style={{
          flex: 1,
          width: 1,
          background:
            'linear-gradient(to bottom, transparent 0%, var(--color-border) 25%, var(--color-border) 75%, transparent 100%)',
        }}
      />
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: '50%',
          background: 'var(--color-indigo)',
          opacity: 0.55,
          flexShrink: 0,
          margin: '10px 0',
        }}
      />
      <span
        style={{
          flex: 1,
          width: 1,
          background:
            'linear-gradient(to bottom, transparent 0%, var(--color-border) 25%, var(--color-border) 75%, transparent 100%)',
        }}
      />
    </div>
  )
}

export function HomePage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section
        style={{
          flex: 'none',
          padding: 'clamp(64px, 10vh, 100px) 0 96px',
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: 'var(--color-base)',
        }}
      >
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <HeroNetworkBackground />
          <HeroColumnDivider />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 64,
              alignItems: 'center',
            }}
            className="hero-grid"
          >
            {/* Left: copy */}
            <div>
              {/* Eyebrow */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 14px',
                  borderRadius: 20,
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface-2)',
                  marginBottom: 32,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-indigo)' }} />
                <span style={{ fontSize: 12, color: 'var(--color-text-primary)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                  One URL. Your keys. Every provider.
                </span>
              </div>

              <h1
                style={{
                  fontSize: 'clamp(40px, 3.5vw, 56px)',
                  lineHeight: 1.0,
                  marginBottom: 28,
                  letterSpacing: '-0.03em',
                }}
              >
                Route any AI call
                <br />
                through{' '}
                <span className="gradient-text">your own keys</span>
              </h1>

              <p
                style={{
                  fontSize: 'clamp(17px, 2.2vw, 21px)',
                  color: 'var(--color-text-muted)',
                  lineHeight: 1.65,
                  maxWidth: 520,
                  marginBottom: 40,
                }}
              >
                Add your OpenAI, Gemini, Groq, or custom API keys with a label.
                Get one base URL. Prefix the model string to route to the exact key you want —
                or skip the prefix when you only have one.
              </p>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link to="/dashboard" className="btn-primary" style={{ fontSize: 17, padding: '16px 32px' }}>
                  Open Dashboard →
                </Link>
                <Link to="/docs" className="btn-ghost" style={{ fontSize: 17, padding: '16px 32px', backgroundColor: 'var(--color-surface)', backdropFilter: 'blur(4px)' }}>
                  Read the docs
                </Link>
              </div>
            </div>

            {/* Right: demo */}
            <div>
              <HeroRouteDemo />
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust Strip ────────────────────────────────────────────────────── */}
      <section
        style={{
          padding: '56px 0 64px',
          position: 'relative',
          zIndex: 1,
          backgroundColor: 'var(--color-base)',
          borderBottom: '1px solid var(--color-border-muted)',
        }}
      >
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 32,
              alignItems: 'start',
            }}
            className="trust-strip"
          >
            {TRUST_BADGES.map((badge, i) => (
              <div
                key={i}
                style={{
                  textAlign: 'center',
                  padding: '0 16px',
                  borderRight: i < 3 ? '1px solid var(--color-border-muted)' : 'none',
                }}
              >
                <p
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(20px, 3vw, 28px)',
                    fontWeight: 700,
                    lineHeight: 1.15,
                    color: 'var(--color-text-primary)',
                    marginBottom: 8,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {badge.label}
                </p>
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                  {badge.caption}
                </p>
              </div>
            ))}
          </div>

          <style>{`
            @media (max-width: 900px) {
              .trust-strip {
                grid-template-columns: repeat(2, 1fr) !important;
              }
              .trust-strip > div {
                border-right: none !important;
                border-bottom: 1px solid var(--color-border-muted);
                padding-bottom: 24px;
              }
              .trust-strip > div:nth-child(3),
              .trust-strip > div:nth-child(4) {
                border-bottom: none !important;
              }
            }
            @media (max-width: 520px) {
              .trust-strip {
                grid-template-columns: 1fr !important;
              }
            }
          `}</style>
        </div>
      </section>

      {/* ── How It Works (BentoGrid component) ──────────────────────────────── */}
      <BentoGrid />
      <SectionDivider />
      <WhyKeyrouteSection />
      <SectionDivider />
      <GetInvolvedSection />
      <SectionDivider />

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section style={{ padding: '120px 0', backgroundColor: 'var(--color-base-alt)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(32px, 5.5vw, 52px)', marginBottom: 20 }}>
            Ready to unify your API keys?
          </h2>
          <p style={{ fontSize: 18, color: 'var(--color-text-muted)', marginBottom: 40, maxWidth: 520, margin: '0 auto 40px' }}>
            Free to start. No credit card. Your keys stay in your own Supabase.
          </p>
          <Link to="/dashboard" className="btn-primary" style={{ fontSize: 18, padding: '18px 40px' }}>
            Open Dashboard →
          </Link>
        </div>
      </section>

      <Footer />

      <style>{`
        @media (max-width: 768px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
            gap: 48px !important;
          }
          .hero-column-divider {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}