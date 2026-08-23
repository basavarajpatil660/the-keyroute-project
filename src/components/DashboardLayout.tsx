import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, Outlet } from 'react-router-dom'
import { useAuthContext } from '../context/AuthProvider'

function ScrollToTop({ children }: { children: React.ReactNode }) {
  const { pathname, hash } = useLocation()
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (hash) return
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [pathname, hash])

  return <main ref={mainRef} style={{ flex: 1, overflowY: 'auto', padding: '32px' }} className="dashboard-main">{children}</main>
}

// SVG icon components for dashboard sidebar nav
const IconOverview = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="1" y="1" width="6" height="6" rx="1" />
    <rect x="9" y="1" width="6" height="6" rx="1" />
    <rect x="1" y="9" width="6" height="6" rx="1" />
    <rect x="9" y="9" width="6" height="6" rx="1" />
  </svg>
)
const IconActivity = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="1,12 5,7 8,10 11,5 15,3" />
    <line x1="1" y1="12" x2="15" y2="12" />
  </svg>
)
const IconConnections = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="4" cy="8" r="2.5" />
    <circle cx="12" cy="4" r="2" />
    <circle cx="12" cy="12" r="2" />
    <line x1="6.5" y1="7" x2="10" y2="5" />
    <line x1="6.5" y1="9" x2="10" y2="11" />
  </svg>
)
const IconKeys = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="6" cy="7" r="3.5" />
    <path d="M9 9.5L14 14.5" />
    <line x1="11" y1="11.5" x2="13" y2="13.5" />
  </svg>
)
const IconUsage = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="1,12 5,7 8,10 11,5 15,3" />
  </svg>
)
const IconSettings = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="8" cy="8" r="2.5" />
    <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M3.05 12.95l1.06-1.06M11.89 4.11l1.06-1.06" />
  </svg>
)

const NAV_ITEMS = [
  { href: '/dashboard/overview',    label: 'Overview',      Icon: IconOverview },
  { href: '/dashboard/activity',    label: 'Activity',      Icon: IconActivity },
  { href: '/dashboard/connections', label: 'Connections',   Icon: IconConnections },
  { href: '/dashboard/keys',        label: 'Provider Keys', Icon: IconKeys },
  { href: '/dashboard/usage',       label: 'Usage',         Icon: IconUsage },
  { href: '/dashboard/settings',    label: 'Settings',      Icon: IconSettings },
]

/**
 * ThemeToggle — same logic as the marketing Navbar's toggle, duplicated
 * here because Navbar deliberately returns null on /dashboard/* routes
 * (dashboard has its own layout, not the marketing header). Both toggles
 * read/write the same data-theme attribute + localStorage key, so
 * switching here stays in sync if the user goes back to the marketing site.
 */
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
    const newTheme = theme === 'light' ? 'dark' : 'light'
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
        width: 28,
        height: 28,
        borderRadius: '50%',
        background: 'transparent',
        border: '1px solid var(--color-border)',
        color: 'var(--color-text-primary)',
        cursor: 'pointer',
        transition: 'background 0.2s, border-color 0.2s',
        flexShrink: 0,
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-text-muted)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border)' }}
    >
      {theme === 'dark' ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  )
}

export function DashboardLayout() {
  const { session, loading } = useAuthContext()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--color-base)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" />
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginTop: 16 }}>Loading…</p>
        </div>
      </div>
    )
  }

  // No early return when session is null: this layout also renders the
  // Connections page BEFORE any owner account exists (Deploy Gateway lives
  // there and is what creates the account). The user section below falls
  // back to a "not connected" hint in that state.

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--color-base)', overflow: 'hidden' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 40,
          }}
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar */}
      <aside
        style={{
          width: 240,
          flexShrink: 0,
          borderRight: '1px solid var(--color-border-muted)',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--color-surface)',
          zIndex: 50,
          transition: 'transform 0.25s ease',
        }}
        className={`dashboard-sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}
        aria-label="Dashboard navigation"
      >
        {/* Logo + theme toggle */}
        <div
          style={{
            padding: '20px 20px 16px',
            borderBottom: '1px solid var(--color-border-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Link
            to="/"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 17,
              fontWeight: 800,
              letterSpacing: '-0.04em',
              color: 'var(--color-text-primary)',
              textDecoration: 'none',
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
                flexShrink: 0,
              }}
              aria-hidden="true"
            >
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="7" cy="7" r="2" fill="#ffffff" stroke="none" />
                <line x1="7" y1="1" x2="7" y2="5" />
                <line x1="7" y1="9" x2="7" y2="13" />
                <line x1="7" y1="7" x2="12" y2="3" />
                <line x1="7" y1="7" x2="2" y2="3" />
              </svg>
            </span>
            Keyroute
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ThemeToggle />
            <button
              className="sidebar-close-btn"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
              style={{
                display: 'none',
                background: 'none',
                border: 'none',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                padding: 4,
                borderRadius: 4,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <line x1="2" y1="2" x2="12" y2="12" />
                <line x1="12" y1="2" x2="2" y2="12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '12px 12px', overflowY: 'auto' }}>
          {NAV_ITEMS.map(item => {
            const isActive = location.pathname === item.href ||
              (item.href === '/dashboard/overview' && location.pathname === '/dashboard')
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 12px',
                  borderRadius: 8,
                  marginBottom: 2,
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                  background: isActive ? 'rgba(232,160,32,0.1)' : 'transparent',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                  borderLeft: isActive ? '2px solid var(--color-amber)' : '2px solid transparent',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(124,143,245,0.06)'
                    ;(e.currentTarget as HTMLAnchorElement).style.color = 'var(--color-text-primary)'
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'
                    ;(e.currentTarget as HTMLAnchorElement).style.color = 'var(--color-text-muted)'
                  }
                }}
              >
                <item.Icon />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User section */}
        <div
          style={{
            padding: '16px 12px',
            borderTop: '1px solid var(--color-border-muted)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 12px',
              borderRadius: 8,
              marginBottom: 4,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: session ? 'var(--color-indigo)' : 'var(--color-surface-2)',
                border: session ? 'none' : '1px dashed var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 700,
                color: session ? '#ffffff' : 'var(--color-text-faint)',
                flexShrink: 0,
              }}
            >
              {session?.user.email?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: session ? 'var(--color-text-primary)' : 'var(--color-text-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {session?.user.email ?? 'No owner account yet'}
              </p>
              <p style={{ fontSize: 11, color: 'var(--color-text-faint)' }}>{session ? 'Free plan' : 'Run Deploy Gateway to create one'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Mobile top bar */}
        <div
          className="dashboard-topbar"
          style={{
            display: 'none',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '12px 16px',
            borderBottom: '1px solid var(--color-border-muted)',
            background: 'var(--color-surface)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
              style={{
                background: 'none',
                border: '1px solid var(--color-border)',
                borderRadius: 6,
                padding: '6px 10px',
                cursor: 'pointer',
                color: 'var(--color-text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <line x1="2" y1="4" x2="14" y2="4" />
                <line x1="2" y1="8" x2="14" y2="8" />
                <line x1="2" y1="12" x2="14" y2="12" />
              </svg>
            </button>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>Keyroute</span>
          </div>
          <ThemeToggle />
        </div>

        {/* Page content */}
        <ScrollToTop>
          <Outlet />
        </ScrollToTop>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .dashboard-sidebar {
            position: fixed !important;
            top: 0;
            left: 0;
            bottom: 0;
            transform: translateX(-100%);
          }
          .dashboard-sidebar.sidebar-open {
            transform: translateX(0) !important;
          }
          .sidebar-close-btn {
            display: flex !important;
          }
          .dashboard-topbar {
            display: flex !important;
          }
          .dashboard-main {
            padding: 20px 16px !important;
          }
        }
        .spinner {
          width: 32px;
          height: 32px;
          border: 2px solid var(--color-border);
          border-top-color: var(--color-amber);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .spinner { animation: none; border-top-color: var(--color-amber); }
        }
      `}</style>
    </div>
  )
}