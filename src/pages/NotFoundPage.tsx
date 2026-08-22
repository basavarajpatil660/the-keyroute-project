import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        background: 'var(--color-base)',
        textAlign: 'center',
      }}
    >
      <div style={{ marginBottom: 24 }}>
        <span
          style={{
            fontSize: 'clamp(80px, 15vw, 140px)',
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            lineHeight: 1,
            color: 'var(--color-text-faint)',
            letterSpacing: '-0.05em',
          }}
        >
          404
        </span>
      </div>

      <h1
        style={{
          fontSize: 'clamp(24px, 4vw, 36px)',
          marginBottom: 12,
          color: 'var(--color-text-primary)',
        }}
      >
        Page not found
      </h1>

      <p
        style={{
          fontSize: 16,
          color: 'var(--color-text-muted)',
          maxWidth: 400,
          marginBottom: 32,
          lineHeight: 1.6,
        }}
      >
        Sorry, we couldn't find the page you're looking for. It might have been
        moved or doesn't exist.
      </p>

      <Link
        to="/"
        className="btn-primary"
        style={{ fontSize: 16, padding: '14px 32px' }}
      >
        Back to home
      </Link>

      <p
        style={{
          marginTop: 32,
          fontSize: 13,
          color: 'var(--color-text-faint)',
          fontFamily: 'var(--font-mono)',
        }}
      >
        <code>{window.location.pathname}</code>
      </p>
    </div>
  )
}