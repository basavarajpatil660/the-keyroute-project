import { Link } from 'react-router-dom'

const ICON_SIZE = 24
const ICON_STROKE = 2

const DatabaseIcon = () => (
  <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={ICON_STROKE} strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M3 5v14c0 1.66 7.33 3 9 3s9-1.34 9-3V5" />
    <path d="M3 12c0 1.66 7.33 3 9 3s9-1.34 9-3" />
  </svg>
)

const GlobeIcon = () => (
  <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={ICON_STROKE} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
)

const ArrowRightIcon = () => (
  <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={ICON_STROKE} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 17 10 11 4 5" />
    <line x1="10" y1="11" x2="20" y2="11" />
  </svg>
)

const ShieldIcon = () => (
  <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={ICON_STROKE} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
)

const GiftIcon = () => (
  <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={ICON_STROKE} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 12.58 20 22.5 4 22.5 4 12.58" />
    <path d="M4 12.58V7.42c0-2.93 5.14-5.23 8-6 2.86.77 8 3.07 8 6v5.18" />
  </svg>
)

const ServerIcon = () => (
  <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={ICON_STROKE} strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
    <path d="M8 21h8" />
    <path d="M12 17v4" />
  </svg>
)

const IssueIcon = () => (
  <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
)

const BugIcon = () => (
  <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)

const MailIcon = () => (
  <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
)

const WHY_CHOOSE = [
  {
    title: 'Your Own Supabase',
    description: 'Your credentials live in your own database, not ours. We hold a reference, not your keys.',
    icon: <DatabaseIcon />,
  },
  {
    title: 'One Unified Endpoint',
    description: 'Swap your API key and base URL. Every provider behind one OpenAI-compatible interface.',
    icon: <GlobeIcon />,
  },
  {
    title: 'Prefix-Based Routing',
    description: 'Target the exact key you want with label/model — or skip it entirely with one key per provider.',
    icon: <ArrowRightIcon />,
  },
  {
    title: 'AES-256 Encrypted',
    description: 'Provider keys are encrypted before they\'re ever written to your database.',
    icon: <ShieldIcon />,
  },
  {
    title: 'Free Forever',
    description: 'No trial, no card, no usage markup. You pay your providers directly at their rates.',
    icon: <GiftIcon />,
  },
  {
    title: 'Multi-Provider Support',
    description: 'OpenAI, Gemini, Groq, and custom endpoints today — more providers planned.',
    icon: <ServerIcon />,
  },
]

const GET_INVOLVED = [
  {
    title: 'Suggest Features',
    description: 'Open an issue with your idea — we read every one.',
    href: 'https://github.com/YOUR_GITHUB_USERNAME/keyroute/issues',
    external: true,
    icon: <IssueIcon />,
  },
  {
    title: 'Report Bugs',
    description: 'Found something broken? File a bug so we can fix it.',
    href: 'https://github.com/YOUR_GITHUB_USERNAME/keyroute/issues',
    external: true,
    icon: <BugIcon />,
  },
  {
    title: 'Get Support',
    description: 'Questions? Email us directly.',
    href: 'mailto:YOUR_EMAIL_HERE',
    external: false,
    icon: <MailIcon />,
  },
]

export function WhyKeyrouteSection() {
  // Was .section-alt — same background as BentoGrid directly above it,
  // with nothing in between, so the two sections visually fused into one
  // slab of cards. Switched to base + a SectionDivider in HomePage now
  // creates a real seam. See SectionDivider.tsx for the divider itself.
  return (
    <section style={{ padding: '100px 0', backgroundColor: 'var(--color-base)' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 72 }}>
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-amber)', marginBottom: 12 }}>
            Why choose Keyroute
          </p>
          <h2 style={{ fontSize: 'clamp(28px, 5vw, 44px)', marginBottom: 16 }}>
            Built for developers who own their keys.
          </h2>
          <p style={{ fontSize: 17, color: 'var(--color-text-muted)', maxWidth: 520, margin: '0 auto' }}>
            No lock-in. No plaintext. Just a clean routing layer on top of your own infrastructure.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 20,
          }}
          className="why-choose-grid"
        >
          {WHY_CHOOSE.map((item, i) => (
            <div key={i} className="surface-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 10, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-indigo)' }}>
                {item.icon}
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                {item.title}
              </h3>
              <p style={{ fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.6, flex: 1 }}>
                {item.description}
              </p>
            </div>
          ))}
        </div>

        <style>{`
          @media (max-width: 900px) {
            .why-choose-grid {
              grid-template-columns: repeat(2, 1fr) !important;
            }
          }
          @media (max-width: 520px) {
            .why-choose-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </div>
    </section>
  )
}

export function GetInvolvedSection() {
  return (
    <section style={{ padding: '100px 0', backgroundColor: 'var(--color-base)' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontSize: 'clamp(28px, 5vw, 44px)', marginBottom: 12 }}>
            Get involved
          </h2>
          <p style={{ fontSize: 17, color: 'var(--color-text-muted)', maxWidth: 520, margin: '0 auto' }}>
            Keyroute is open source. Help shape the future of key routing.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 20,
            maxWidth: 800,
            margin: '0 auto',
          }}
          className="get-involved-grid"
        >
          {GET_INVOLVED.map((item, i) => (
            <Link
              key={i}
              to={item.href}
              target={item.external ? '_blank' : undefined}
              rel={item.external ? 'noopener noreferrer' : undefined}
              className="surface-card"
              style={{ padding: '24px', textAlign: 'center', textDecoration: 'none', transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease' }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)'
                e.currentTarget.style.borderColor = 'rgba(124, 143, 245, 0.4)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'var(--shadow-card)'
                e.currentTarget.style.borderColor = 'var(--color-border)'
              }}
            >
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 10, background: 'var(--color-surface-2)', border: '1px solid var(--color-border-muted)', margin: '0 auto 16px', color: 'var(--color-indigo)' }}>
                {item.icon}
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8 }}>
                {item.title}
              </h3>
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                {item.description}
              </p>
            </Link>
          ))}
        </div>

        <style>{`
          @media (max-width: 768px) {
            .get-involved-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </div>
    </section>
  )
}