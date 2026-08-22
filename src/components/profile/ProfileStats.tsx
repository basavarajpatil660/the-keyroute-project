import { useMemo } from 'react'

export interface ProfileSummary {
  display_name: string | null
  email: string
  member_since: string
  total_requests: number
  total_tokens_in: number
  total_tokens_out: number
}

interface ProfileStatsProps {
  data: ProfileSummary | null
  isLoading?: boolean
  isError?: boolean
  error?: Error | null
  onRenameClick?: () => void
  editingDisplayName?: boolean
  displayNameInput?: string
  setDisplayNameInput?: (value: string) => void
  onSaveDisplayName?: () => void
  onCancelDisplayName?: () => void
}

const formatNumber = (n: number | null | undefined): string => {
  const value = n ?? 0
  if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M'
  if (value >= 1000) return (value / 1000).toFixed(1) + 'k'
  return value.toLocaleString()
}

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

export function ProfileStats({
  data,
  isLoading = false,
  isError = false,
  error = null,
  onRenameClick,
  editingDisplayName = false,
  displayNameInput = '',
  setDisplayNameInput,
  onSaveDisplayName,
  onCancelDisplayName,
}: ProfileStatsProps) {
  const displayName = data?.display_name || 'Unnamed user'
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const avatarColor = useMemo(() => {
    let hash = 0
    for (let i = 0; i < displayName.length; i++) {
      hash = displayName.charCodeAt(i) + ((hash << 5) - hash)
    }
    const hue = Math.abs(hash) % 360
    return `hsl(${hue}, 55%, 45%)`
  }, [displayName])

  if (isLoading) {
    return (
      <div className="surface-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="skeleton-bar" style={{ width: 40, height: 40, borderRadius: '50%' }} />
          <div>
            <div className="skeleton-bar" style={{ width: 120, height: 18, borderRadius: 4 }} />
            <div className="skeleton-bar" style={{ width: 80, height: 14, borderRadius: 4, marginTop: 6 }} />
          </div>
        </div>
        <div style={{ marginTop: 20, display: 'flex', gap: 24 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ flex: 1 }}>
              <div className="skeleton-bar" style={{ height: 28, width: '60%', marginBottom: 4 }} />
              <div className="skeleton-bar" style={{ height: 12, width: '40%' }} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="surface-card" style={{ padding: '20px', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-red)', marginBottom: 12 }}>{error?.message || 'Failed to load profile'}</p>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="surface-card" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: avatarColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            fontWeight: 700,
            color: '#ffffff',
            flexShrink: 0,
          }}
        >
          {initials || '?'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {editingDisplayName ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="text"
                value={displayNameInput}
                onChange={e => setDisplayNameInput?.(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') onSaveDisplayName?.()
                  if (e.key === 'Escape') onCancelDisplayName?.()
                }}
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text-primary)',
                  fontSize: 15,
                  fontWeight: 600,
                  outline: 'none',
                  fontFamily: 'var(--font-body)',
                }}
                autoFocus
              />
              <button
                onClick={onSaveDisplayName}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '6px 8px',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--color-indigo)',
                  display: 'inline-flex',
                }}
                title="Save"
              >
                <CheckIcon />
              </button>
              <button
                onClick={onCancelDisplayName}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '6px 8px',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--color-text-muted)',
                  display: 'inline-flex',
                }}
                title="Cancel"
              >
                <CloseIcon />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {displayName}
              </p>
              {onRenameClick && (
                <button
                  onClick={onRenameClick}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '6px 8px',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--color-text-muted)',
                    display: 'inline-flex',
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-indigo)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-muted)' }}
                  title="Rename"
                  aria-label="Rename"
                >
                  <EditIcon />
                </button>
              )}
            </div>
          )}
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>{data.email}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 120 }}>
          <p style={{ fontSize: 24, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 2 }}>
            {formatNumber(data.total_requests)}
          </p>
          <p style={{ fontSize: 12, color: 'var(--color-text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Total requests
          </p>
        </div>
        <div style={{ flex: 1, minWidth: 120 }}>
          <p style={{ fontSize: 24, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 2 }}>
            {formatNumber(data.total_tokens_in)}
          </p>
          <p style={{ fontSize: 12, color: 'var(--color-text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Tokens received
          </p>
        </div>
        <div style={{ flex: 1, minWidth: 120 }}>
          <p style={{ fontSize: 24, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 2 }}>
            {formatNumber(data.total_tokens_out)}
          </p>
          <p style={{ fontSize: 12, color: 'var(--color-text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Tokens burned
          </p>
        </div>
      </div>
    </div>
  )
}