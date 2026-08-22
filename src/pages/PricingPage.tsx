import { Link } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'

const PLAN_FEATURES = [
  'Unified OpenAI-compatible endpoint',
  'Connect your own Supabase project',
  'Unlimited provider key labels',
  'OpenAI, Gemini, Groq, and custom endpoints',
  'Prefix-in-model-string routing',
  'Auto-detection for single-key providers',
  'Usage logs (request count, latency, token counts)',
  'Up to 1 platform API key',
]

const DONATE_REASONS = [
  'Feeds the developer — literally, chai and Maggi money',
  'Funds late-night coding sessions between semester exams',
  'Keeps the project alive when college gets busy',
  'No perks, no tiers, no upsell — just good karma',
]

export function PricingPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(64px, 10vh, 100px) 0 48px', textAlign: 'center' }}>
        <div className="container">
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-amber)', marginBottom: 16 }}>
            The Plan
          </p>
          <h1 style={{ fontSize: 'clamp(36px, 6vw, 64px)', marginBottom: 20 }}>
            Free.{' '}
            <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>Forever. Actually.</span>
          </h1>
          <p style={{ fontSize: 18, color: 'var(--color-text-muted)', maxWidth: 560, margin: '0 auto' }}>
            There's no company behind Keyroute charging you anything. Bring your own Supabase project,
            bring your own provider keys, run it yourself.
          </p>
        </div>
      </section>

      {/* ── Plan + Support cards ───────────────────────────────────────────── */}
      <section style={{ padding: '0 0 80px' }}>
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 20,
              maxWidth: 840,
              margin: '0 auto',
            }}
          >
            {/* The one and only plan */}
            <div
              className="surface-card"
              style={{
                borderRadius: 'var(--radius-xl)',
                padding: '36px',
                position: 'relative',
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 12px',
                  borderRadius: 20,
                  background: 'rgba(240,165,0,0.1)',
                  border: '1px solid rgba(240,165,0,0.3)',
                  marginBottom: 24,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-amber)' }} />
                <span style={{ fontSize: 11, color: 'var(--color-amber)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                  The only plan
                </span>
              </div>

              <h2 style={{ fontSize: 28, marginBottom: 4 }}>Everything</h2>
              <p
                style={{
                  fontSize: 44,
                  fontFamily: 'var(--font-display)',
                  fontWeight: 800,
                  letterSpacing: '-0.04em',
                  marginBottom: 4,
                  color: 'var(--color-amber)',
                }}
              >
                $0
              </p>
              <p style={{ fontSize: 14, color: 'var(--color-text-faint)', marginBottom: 28 }}>
                no card, no catch, no upsell later
              </p>

              <Link to="/dashboard" className="btn-primary" style={{ display: 'block', textAlign: 'center', marginBottom: 28, fontSize: 15, padding: '14px' }}>
                Open Dashboard →
              </Link>

              <div style={{ borderTop: '1px solid var(--color-border-muted)', paddingTop: 24 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
                  What's included
                </p>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 11 }}>
                  {PLAN_FEATURES.map(f => (
                    <li
                      key={f}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                        fontSize: 14,
                        color: 'var(--color-text-muted)',
                        lineHeight: 1.5,
                      }}
                    >
                      <span style={{ color: 'var(--color-green)', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Support card — replaces the fake "Pro" tier */}
            <div
              className="surface-card"
              style={{
                borderRadius: 'var(--radius-xl)',
                padding: '36px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 12px',
                  borderRadius: 20,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--color-border)',
                  marginBottom: 24,
                  alignSelf: 'flex-start',
                }}
              >
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                  Not a plan, just love
                </span>
              </div>

              <h2 style={{ fontSize: 28, marginBottom: 4 }}>Buy me a chai ☕</h2>
              <p style={{ fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 4 }}>
                Whatever you feel like
              </p>
              <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 28, lineHeight: 1.5 }}>
                Keyroute is a side project, not a business. There's nothing to unlock here — this is
                purely a "this saved me time, here's ₹50" button.
              </p>

              <div style={{ borderTop: '1px solid var(--color-border-muted)', paddingTop: 24 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
                  Where it goes
                </p>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 11 }}>
                  {DONATE_REASONS.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--color-text-muted)' }}>
                      <span style={{ color: 'var(--color-amber)', fontSize: 12 }}>☕</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ marginTop: 'auto', paddingTop: 24 }}>
                {/* TODO: swap this for a real GitHub Sponsors / Buy Me a Coffee / UPI link */}
                <a
                  href="mailto:YOUR_EMAIL_HERE?subject=Chai money for your open source project"
                  className="btn-primary"
                  style={{ display: 'block', textAlign: 'center', fontSize: 15, padding: '14px' }}
                >
                  Send some chai money →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 0' }}>
        <div className="container" style={{ maxWidth: 680, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 32px)', marginBottom: 40, textAlign: 'center' }}>
            FAQ
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              {
                q: 'Is this actually free, forever?',
                a: 'Yes. There\'s no hidden tier waiting to appear later. You bring your own Supabase project and your own provider keys — Keyroute is just the routing layer in between.',
              },
              {
                q: 'Do you store my API keys?',
                a: 'They\'re AES-256 encrypted and live in your own Supabase project, not ours. Your Supabase service key sits in Supabase Vault. Nothing sensitive touches our servers in plaintext.',
              },
              {
                q: 'Can I self-host this?',
                a: 'That\'s the whole point. Keyroute is (or will be) open source — clone it, connect your own Supabase project, and run it entirely under your own control.',
              },
              {
                q: 'Will this be actively maintained?',
                a: 'Honestly — it\'s a side project built by one person around college. Features land when there\'s time, not on a schedule. That\'s exactly why it\'s being open sourced: so it doesn\'t depend on just one person.',
              },
              {
                q: 'Can I contribute?',
                a: 'Yes — PRs, issues, and ideas are welcome once the repo is public. Nothing to sign, nothing to buy.',
              },
            ].map((faq, i, arr) => (
              <div
                key={i}
                style={{
                  padding: '24px 0',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--color-border-muted)' : 'none',
                }}
              >
                <h3 style={{ fontSize: 16, marginBottom: 10, lineHeight: 1.4 }}>{faq.q}</h3>
                <p style={{ fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.7 }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
