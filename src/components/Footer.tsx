import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--color-border-muted)',
        marginTop: 'auto',
        padding: '48px 0 32px',
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 32,
            marginBottom: 40,
          }}
        >
          {/* Brand */}
          <div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 18,
                fontWeight: 800,
                letterSpacing: '-0.04em',
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  background: 'var(--color-indigo)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  color: '#ffffff',
                }}
              >
                ⌘
              </span>
              Keyroute
            </div>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.6, maxWidth: 200 }}>
              One URL. Your keys. Every provider.
            </p>
          </div>

          {/* Product */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
              Product
            </p>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }} aria-label="Footer product links">
              <FooterLink to="/">Home</FooterLink>
              <FooterLink to="/docs">Docs</FooterLink>
              <FooterLink to="/setup">Setup</FooterLink>
              <FooterLink to="/help">Help</FooterLink>
              <FooterLink to="/pricing">Pricing</FooterLink>
            </nav>
          </div>

          {/* Legal */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
              Legal
            </p>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }} aria-label="Footer legal links">
              <FooterLink to="#">Privacy Policy</FooterLink>
              <FooterLink to="#">Terms of Service</FooterLink>
            </nav>
          </div>
        </div>

        <div
          style={{
            borderTop: '1px solid var(--color-border-muted)',
            paddingTop: 24,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <p style={{ fontSize: 13, color: 'var(--color-text-faint)' }}>
            © {new Date().getFullYear()} Keyroute. Your keys stay yours.
          </p>
          <p style={{ fontSize: 13, color: 'var(--color-text-faint)' }}>
            Built with zero plaintext key storage.
          </p>
        </div>
      </div>
    </footer>
  )
}

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      style={{ fontSize: 14, color: 'var(--color-text-muted)', textDecoration: 'none', transition: 'color 0.15s' }}
      onMouseEnter={e => ((e.target as HTMLAnchorElement).style.color = 'var(--color-text-primary)')}
      onMouseLeave={e => ((e.target as HTMLAnchorElement).style.color = 'var(--color-text-muted)')}
    >
      {children}
    </Link>
  )
}
