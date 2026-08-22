import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

const NAV_LINKS = [
  { href: '/docs', label: 'Docs' },
  { href: '/setup', label: 'Setup' },
  { href: '/help', label: 'Help' },
  { href: '/pricing', label: 'Pricing' },
]

function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') || 'dark'
  })

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          const currentTheme = document.documentElement.getAttribute('data-theme')
          if (currentTheme === 'light' || currentTheme === 'dark') {
            setTheme(currentTheme)
          }
        }
      })
    })

    observer.observe(document.documentElement, { attributes: true })
    return () => observer.disconnect()
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('keyroute-theme', newTheme)
  }

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 32,
        height: 32,
        borderRadius: '50%',
        background: 'transparent',
        border: '1px solid var(--color-border)',
        color: 'var(--color-text-primary)',
        cursor: 'pointer',
        transition: 'background 0.2s, border-color 0.2s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-text-muted)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border)'
      }}
    >
      {theme === 'dark' ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="4.22" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  )
}

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const isDashboard = location.pathname.startsWith('/dashboard')

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  if (isDashboard) return null

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        borderBottom: scrolled ? '1px solid var(--color-border-muted)' : '1px solid transparent',
        backgroundColor: scrolled ? 'var(--color-base)' : 'transparent',
        transition: 'background-color 0.2s ease, border-color 0.2s ease',
      }}
    >
      <div className="container" style={{ display: 'flex', alignItems: 'center', height: 64 }}>
        {/* Logo */}
        <Link
          to="/"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 20,
            fontWeight: 800,
            color: 'var(--color-text-primary)',
            letterSpacing: '-0.04em',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            textDecoration: 'none',
          }}
        >
          <span
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: 'var(--color-indigo)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
            aria-hidden="true"
          >
            {/* Route/fork icon */}
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="7" cy="7" r="2" fill="#ffffff" stroke="none" />
              <line x1="7" y1="1" x2="7" y2="5" />
              <line x1="7" y1="9" x2="7" y2="13" />
              <line x1="7" y1="7" x2="12" y2="3" />
              <line x1="7" y1="7" x2="2" y2="3" />
            </svg>
          </span>
          Keyroute
        </Link>

        {/* Desktop nav */}
        <nav
          style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 32 }}
          aria-label="Main navigation"
        >
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              to={link.href}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 14,
                fontWeight: 500,
                color: location.pathname === link.href
                  ? 'var(--color-text-primary)'
                  : 'var(--color-text-muted)',
                transition: 'color 0.15s ease, background 0.15s ease',
                textDecoration: 'none',
              }}
              onMouseEnter={e => {
                (e.target as HTMLAnchorElement).style.color = 'var(--color-text-primary)'
                ;(e.target as HTMLAnchorElement).style.background = 'rgba(139, 148, 158, 0.05)'
              }}
              onMouseLeave={e => {
                (e.target as HTMLAnchorElement).style.color =
                  location.pathname === link.href ? 'var(--color-text-primary)' : 'var(--color-text-muted)'
                ;(e.target as HTMLAnchorElement).style.background = 'transparent'
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Desktop CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ThemeToggle />
          <Link to="/dashboard" className="btn-primary" style={{ padding: '8px 18px', fontSize: 14 }}>
            Open Dashboard →
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(v => !v)}
          style={{
            display: 'none',
            background: 'none',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '6px 10px',
            cursor: 'pointer',
            color: 'var(--color-text-primary)',
            fontSize: 18,
            lineHeight: 1,
            marginLeft: 12,
          }}
          className="mobile-menu-btn"
        >
          {menuOpen ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="3" y1="3" x2="13" y2="13" />
              <line x1="13" y1="3" x2="3" y2="13" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="2" y1="4" x2="14" y2="4" />
              <line x1="2" y1="8" x2="14" y2="8" />
              <line x1="2" y1="12" x2="14" y2="12" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          style={{
            borderTop: '1px solid var(--color-border-muted)',
            padding: '16px 0',
            background: 'var(--color-base)',
          }}
        >
          <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                to={link.href}
                style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 15,
                  fontWeight: 500,
                  color: 'var(--color-text-primary)',
                  textDecoration: 'none',
                }}
              >
                {link.label}
              </Link>
            ))}
            <div style={{ height: 1, background: 'var(--color-border-muted)', margin: '8px 0' }} />
            <div style={{ padding: '4px 12px', display: 'flex', justifyContent: 'flex-start' }}>
              <ThemeToggle />
            </div>
            <Link to="/dashboard" className="btn-primary" style={{ textAlign: 'center', marginTop: 4 }}>
              Open Dashboard →
            </Link>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
          header > div > a + div + div { display: none !important; }
        }
      `}</style>
    </header>
  )
}
