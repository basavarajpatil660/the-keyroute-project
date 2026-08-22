import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { ProfileStats, type ProfileSummary } from '../../components/profile/ProfileStats'

interface PlatformKeyRow {
  id: string
  key_prefix: string
  name: string | null
  created_at: string
  last_used_at: string | null
  expires_at: string | null
}

async function fetchKeys(): Promise<PlatformKeyRow[]> {
  const { data, error } = await supabase
    .from('platform_keys')
    .select('id, key_prefix, name, created_at, last_used_at, expires_at')
    .eq('revoked', false)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as PlatformKeyRow[]
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message
  if (err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
    return (err as { message: string }).message
  }
  return fallback
}

export function SettingsPage() {
  const queryClient = useQueryClient()
  const [generating, setGenerating] = useState(false)
  const [newKey, setNewKey] = useState<{ plaintext: string; prefix: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tableMessage, setTableMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Profile section state
  const [editingDisplayName, setEditingDisplayName] = useState(false)
  const [displayNameInput, setDisplayNameInput] = useState('')
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)

  // Inline edit state
  const [editingKeyId, setEditingKeyId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editExpiryDuration, setEditExpiryDuration] = useState<'never' | '1d' | '1m' | '6m' | '12m' | '24m'>('never')
  const editPanelRef = useRef<HTMLDivElement>(null)

  const { data: keys = [], isLoading: loadingKeys, isError, error: queryError } = useQuery({
    queryKey: ['platformKeys'],
    queryFn: fetchKeys,
  })

  const { data: profileData, isLoading: loadingProfile, isError: profileError, error: profileQueryError } = useQuery({
    queryKey: ['profileSummary'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_profile_summary')
      if (error) throw new Error(error.message)
      // get_profile_summary is declared RETURNS TABLE(...) in Postgres, so
      // PostgREST always comes back with an array (one row) rather than a
      // bare object — same reason create_platform_key unwraps data[0] above.
      const row = Array.isArray(data) ? data[0] : data
      return (row ?? null) as ProfileSummary | null
    },
  })

  const generateMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('create_platform_key', { p_name: null })
      if (error) throw error
      const row = Array.isArray(data) ? data[0] : data
      if (!row?.plaintext_key) throw new Error('Key generation returned no value')
      return { plaintext: row.plaintext_key, prefix: row.key_prefix }
    },
    onSuccess: (newKeyData) => {
      setNewKey(newKeyData)
      setCopied(false)
      queryClient.invalidateQueries({ queryKey: ['platformKeys'] })
    },
    onError: (err) => {
      setError(getErrorMessage(err, 'Failed to generate key'))
    },
    onSettled: () => {
      setGenerating(false)
    },
  })

  const handleGenerate = () => {
    setError(null)
    setCopied(false)
    setGenerating(true)
    generateMutation.mutate()
  }

  const handleCopy = async () => {
    if (!newKey) return
    await navigator.clipboard.writeText(newKey.plaintext)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const openEdit = (key: PlatformKeyRow) => {
    setEditingKeyId(key.id)
    setEditName(key.name || '')
    if (key.expires_at) {
      const expiryDate = new Date(key.expires_at)
      const now = new Date()
      const diffMs = expiryDate.getTime() - now.getTime()
      const diffDays = diffMs / (1000 * 60 * 60 * 24)
      const diffMonths = diffDays / 30.44

      if (diffDays <= 1.5) {
        setEditExpiryDuration('1d')
      } else if (diffMonths <= 1.5) {
        setEditExpiryDuration('1m')
      } else if (diffMonths <= 6.5) {
        setEditExpiryDuration('6m')
      } else if (diffMonths <= 12.5) {
        setEditExpiryDuration('12m')
      } else {
        setEditExpiryDuration('24m')
      }
    } else {
      setEditExpiryDuration('never')
    }
  }

  const closeEdit = () => {
    setEditingKeyId(null)
    setEditName('')
    setEditExpiryDuration('never')
  }

  const editMutation = useMutation({
    mutationFn: async ({ keyId, name, expiresAt }: { keyId: string; name: string; expiresAt: string | null }) => {
      const { error } = await supabase.rpc('update_platform_key', {
        p_key_id: keyId,
        p_name: name.trim(),
        p_expires_at: expiresAt,
      })
      if (error) throw error
    },
    onSuccess: () => {
      setTableMessage({ type: 'success', text: 'Key updated.' })
      closeEdit()
      queryClient.invalidateQueries({ queryKey: ['platformKeys'] })
    },
    onError: (err) => {
      setTableMessage({ type: 'error', text: getErrorMessage(err, 'Failed to update key') })
    },
  })

  const saveEdit = () => {
    if (!editingKeyId) return
    if (!editName.trim()) {
      setTableMessage({ type: 'error', text: 'Name is required.' })
      return
    }

    setTableMessage(null)
    let expiresAt: string | null = null
    if (editExpiryDuration !== 'never') {
      const now = new Date()
      switch (editExpiryDuration) {
        case '1d':
          now.setDate(now.getDate() + 1)
          break
        case '1m':
          now.setMonth(now.getMonth() + 1)
          break
        case '6m':
          now.setMonth(now.getMonth() + 6)
          break
        case '12m':
          now.setFullYear(now.getFullYear() + 1)
          break
        case '24m':
          now.setFullYear(now.getFullYear() + 2)
          break
      }
      expiresAt = now.toISOString()
    }

    editMutation.mutate({ keyId: editingKeyId, name: editName.trim(), expiresAt })
  }

  const revokeMutation = useMutation({
    mutationFn: async (keyId: string) => {
      const { error } = await supabase.rpc('revoke_platform_key', { p_key_id: keyId })
      if (error) throw error
    },
    onSuccess: () => {
      setTableMessage({ type: 'success', text: 'Key deleted.' })
      queryClient.invalidateQueries({ queryKey: ['platformKeys'] })
    },
    onError: (err) => {
      setTableMessage({ type: 'error', text: getErrorMessage(err, 'Failed to delete key') })
    },
  })

  // Profile mutations
  const renameMutation = useMutation({
    mutationFn: async (newName: string) => {
      const { error } = await supabase.rpc('update_display_name', { p_new_name: newName.trim() })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profileSummary'] })
      setTableMessage({ type: 'success', text: 'Display name updated.' })
    },
    onError: (err) => {
      setTableMessage({ type: 'error', text: getErrorMessage(err, 'Failed to update display name') })
    },
  })

  const passwordMutation = useMutation({
    mutationFn: async (newPassword: string) => {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
    },
    onSuccess: () => {
      setPasswordModalOpen(false)
      setNewPassword('')
      setConfirmPassword('')
      setTableMessage({ type: 'success', text: 'Password changed successfully.' })
    },
    onError: (err) => {
      setPasswordError(getErrorMessage(err, 'Failed to change password'))
    },
  })

  const startRename = () => {
    setEditingDisplayName(true)
    setDisplayNameInput(profileData?.display_name || '')
  }

  const cancelRename = () => {
    setEditingDisplayName(false)
    setDisplayNameInput('')
  }

  const saveRename = () => {
    const trimmed = displayNameInput.trim()
    if (!trimmed) return
    if (trimmed.length > 60) {
      setTableMessage({ type: 'error', text: 'Display name must be 60 characters or less.' })
      return
    }
    renameMutation.mutate(trimmed)
    cancelRename()
  }

  const openPasswordModal = () => {
    setPasswordError(null)
    setNewPassword('')
    setConfirmPassword('')
    setPasswordModalOpen(true)
  }

  const closePasswordModal = () => {
    setPasswordModalOpen(false)
    setNewPassword('')
    setConfirmPassword('')
    setPasswordError(null)
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters')
      return
    }
    passwordMutation.mutate(newPassword)
  }

  const handleRevoke = (key: PlatformKeyRow) => {
    if (!window.confirm(`Delete key "${key.name || key.key_prefix}"? Any app using it will stop working immediately.`)) return
    setTableMessage(null)
    revokeMutation.mutate(key.id)
  }

  const renderEditPanel = (key: PlatformKeyRow) => {
    const durationOptions = [
      { value: 'never' as const, label: 'Never' },
      { value: '1d' as const, label: '1 day' },
      { value: '1m' as const, label: '1 month' },
      { value: '6m' as const, label: '6 months' },
      { value: '12m' as const, label: '12 months' },
      { value: '24m' as const, label: '24 months' },
    ]

    return (
      <div
        ref={editPanelRef}
        style={{
          gridColumn: '1 / -1',
          padding: '20px 20px 24px',
          background: 'var(--color-surface-2)',
          borderTop: '1px solid var(--color-border-muted)',
          borderBottom: '1px solid var(--color-border-muted)',
          overflow: 'hidden',
        }}
      >
        <div style={{ maxWidth: 420, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Edit platform key</h3>
            <span style={{ fontSize: 12, color: 'var(--color-text-faint)', fontFamily: 'var(--font-mono)' }}>
              {key.key_prefix}••••••••
            </span>
          </div>

          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text-faint)', marginBottom: 6 }}>
            Name
          </label>
          <input
            value={editName}
            onChange={e => setEditName(e.target.value)}
            placeholder='e.g. "production server"'
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              fontSize: 13,
              outline: 'none',
              boxSizing: 'border-box',
              marginBottom: 16,
            }}
            autoFocus
          />

          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text-faint)', marginBottom: 6 }}>
            Expiry
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            {durationOptions.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setEditExpiryDuration(opt.value)}
                style={{
                  flex: '1 1 calc(33.333% - 6px)',
                  minWidth: 90,
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  background: editExpiryDuration === opt.value ? 'var(--color-amber)' : 'var(--color-surface)',
                  color: editExpiryDuration === opt.value ? 'var(--color-surface)' : 'var(--color-text-primary)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxSizing: 'border-box',
                }}
                onMouseEnter={e => {
                  if (editExpiryDuration !== opt.value) {
                    e.currentTarget.style.borderColor = 'var(--color-amber)'
                    e.currentTarget.style.color = 'var(--color-amber)'
                  }
                }}
                onMouseLeave={e => {
                  if (editExpiryDuration !== opt.value) {
                    e.currentTarget.style.borderColor = 'var(--color-border)'
                    e.currentTarget.style.color = 'var(--color-text-primary)'
                  }
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, width: '100%', marginTop: 4 }}>
            <button
              onClick={closeEdit}
              className="btn-ghost"
              style={{ fontSize: 14, padding: '10px 20px', cursor: 'pointer', flexShrink: 0 }}
            >
              Cancel
            </button>
            <button
              onClick={saveEdit}
              disabled={editMutation.isPending}
              className="btn-primary"
              style={{ fontSize: 14, padding: '10px 20px', cursor: editMutation.isPending ? 'not-allowed' : 'pointer', opacity: editMutation.isPending ? 0.6 : 1, flexShrink: 0 }}
            >
              {editMutation.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, marginBottom: 4 }}>Settings</h1>
        <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>
          Platform API keys and account configuration.
        </p>
      </div>

      {/* Profile section */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 17, marginBottom: 16 }}>Profile</h2>
        <ProfileStats
          data={profileData ?? null}
          isLoading={loadingProfile}
          isError={profileError}
          error={profileQueryError}
          onRenameClick={startRename}
          editingDisplayName={editingDisplayName}
          displayNameInput={displayNameInput}
          setDisplayNameInput={setDisplayNameInput}
          onSaveDisplayName={saveRename}
          onCancelDisplayName={cancelRename}
        />
        <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button
            onClick={openPasswordModal}
            style={{
              padding: '9px 18px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface-2)',
              color: 'var(--color-text-primary)',
              fontSize: 13,
              fontFamily: 'var(--font-body)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--color-amber)'
              e.currentTarget.style.color = 'var(--color-amber)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--color-border)'
              e.currentTarget.style.color = 'var(--color-text-primary)'
            }}
          >
            Change password
          </button>
        </div>
      </section>

      {/* Platform keys section */}
      <section style={{ marginBottom: 32 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <div>
            <h2 style={{ fontSize: 17, marginBottom: 2 }}>Platform API Keys</h2>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
              Keys your application uses to authenticate with Keyroute. Generated via <code>create_platform_key</code> RPC.
            </p>
          </div>
          <button
            className="btn-primary"
            style={{ fontSize: 14, padding: '10px 20px', cursor: generating ? 'not-allowed' : 'pointer', opacity: generating ? 0.6 : 1 }}
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? 'Generating…' : '+ Generate key'}
          </button>
        </div>

        {/* Raw key shown once, right after generation */}
        {newKey && (
          <div
            style={{
              padding: '16px 20px',
              borderRadius: 'var(--radius-lg)',
              background: 'rgba(232,160,32,0.08)',
              border: '1px solid rgba(232,160,32,0.3)',
              marginBottom: 16,
            }}
          >
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-amber)', marginBottom: 8 }}>
              Copy this now — it won't be shown again.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <code
                style={{
                  flex: 1,
                  minWidth: 220,
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 13,
                  color: 'var(--color-text-primary)',
                  overflowX: 'auto',
                  whiteSpace: 'nowrap',
                }}
              >
                {newKey.plaintext}
              </code>
              <button
                onClick={handleCopy}
                className="btn-ghost"
                style={{ fontSize: 13, padding: '9px 16px', cursor: 'pointer' }}
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(248,81,73,0.1)',
              border: '1px solid rgba(248,81,73,0.3)',
              color: 'var(--color-red)',
              fontSize: 13,
              marginBottom: 16,
            }}
            role="alert"
          >
            {error}
          </div>
        )}

        {tableMessage && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              background: tableMessage.type === 'success' ? 'rgba(63,185,80,0.1)' : 'rgba(248,81,73,0.1)',
              border: `1px solid ${tableMessage.type === 'success' ? 'rgba(63,185,80,0.3)' : 'rgba(248,81,73,0.3)'}`,
              color: tableMessage.type === 'success' ? 'var(--color-green)' : 'var(--color-red)',
              fontSize: 13,
              marginBottom: 16,
            }}
            role="alert"
          >
            {tableMessage.text}
          </div>
        )}

        <div className="surface-card" style={{ overflow: 'hidden' }}>
          {isError ? (
            <div style={{ padding: '32px 20px', textAlign: 'center' }}>
              <p style={{ color: 'var(--color-red)', marginBottom: 16, fontSize: 14 }}>{(queryError as Error).message}</p>
              <button
                onClick={() => queryClient.invalidateQueries({ queryKey: ['platformKeys'] })}
                className="btn-primary"
                style={{ fontSize: 13, padding: '10px 20px' }}
              >
                Retry
              </button>
            </div>
          ) : !loadingKeys && keys.length > 0 ? (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 120px 120px 130px 80px',
                  gap: 16,
                  padding: '12px 20px',
                  borderBottom: '1px solid var(--color-border-muted)',
                  background: 'var(--color-surface-2)',
                }}
              >
                {['Key', 'Created', 'Last used', 'Expires', 'Actions'].map(col => (
                  <span key={col} style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-faint)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    {col}
                  </span>
                ))}
              </div>
              {keys.map(k => {
                const isExpired = k.expires_at ? new Date(k.expires_at) < new Date() : false
                const isEditing = editingKeyId === k.id
                return (
                  <>
                    <div
                      key={k.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 120px 120px 130px 80px',
                        gap: 16,
                        padding: '14px 20px',
                        borderBottom: '1px solid var(--color-border-muted)',
                        fontSize: 13,
                        alignItems: 'center',
                        background: isEditing ? 'var(--color-surface-2)' : 'transparent',
                        transition: 'background 0.2s ease',
                      }}
                    >
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>
                        {k.key_prefix}••••••••{k.name ? `  (${k.name})` : ''}
                      </span>
                      <span style={{ color: 'var(--color-text-faint)' }}>{new Date(k.created_at).toLocaleDateString()}</span>
                      <span style={{ color: 'var(--color-text-faint)' }}>
                        {k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : 'Never'}
                      </span>
                      <span style={{ color: isExpired ? 'var(--color-red)' : 'var(--color-text-faint)' }}>
                        {k.expires_at ? (isExpired ? 'Expired' : new Date(k.expires_at).toLocaleDateString()) : 'Never'}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <button
                          onClick={() => isEditing ? closeEdit() : openEdit(k)}
                          title={isEditing ? 'Close' : 'Edit'}
                          aria-label={isEditing ? 'Close' : 'Edit'}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px 8px', borderRadius: 'var(--radius-sm)', color: isEditing ? 'var(--color-indigo)' : 'var(--color-text-muted)', display: 'inline-flex' }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            {isEditing ? (
                              <>
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                              </>
                            ) : (
                              <>
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </>
                            )}
                          </svg>
                        </button>
                        <button
                          onClick={() => handleRevoke(k)}
                          title="Delete"
                          aria-label="Delete"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px 8px', borderRadius: 'var(--radius-sm)', color: 'var(--color-text-faint)', display: 'inline-flex' }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {isEditing && renderEditPanel(k)}
                  </>
                )
              })}
            </>
          ) : !loadingKeys ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '80px 32px', minHeight: 320 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-indigo)',
                  marginBottom: 20,
                }}
              >
                <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="6" cy="7" r="3.5" />
                  <path d="M9 9.5L14 14.5" />
                  <line x1="11" y1="11.5" x2="13" y2="13.5" />
                </svg>
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 8, color: 'var(--color-text-primary)' }}>
                No platform keys
              </h3>
              <p style={{ fontSize: 14, color: 'var(--color-text-muted)', maxWidth: 360, lineHeight: 1.6 }}>
                Generate a platform API key to start routing requests through Keyroute. The raw key is shown once on creation.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', minHeight: 200 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-indigo)', animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>Loading…</span>
              </div>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}
        </div>
      </section>

      {/* Base URL section */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 17, marginBottom: 4 }}>Your gateway base URL</h2>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 12 }}>
          Use this as the base URL in your OpenAI-compatible client.
        </p>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 16px',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            fontFamily: 'var(--font-mono)',
            fontSize: 14,
            color: 'var(--color-indigo)',
          }}
        >
          <span style={{ color: 'var(--color-text-faint)' }}>{`${window.location.origin}/api/v1`}</span>
        </div>
      </section>

      {/* Account section */}
      <section>
        <h2 style={{ fontSize: 17, marginBottom: 12 }}>Account</h2>
        <div className="surface-card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid var(--color-border-muted)' }}>
            <p style={{ fontSize: 13, color: 'var(--color-text-faint)', marginBottom: 4 }}>Plan</p>
            <p style={{ fontSize: 15, fontWeight: 600 }}>Free — no card required</p>
          </div>
          <div style={{ padding: '20px' }}>
            <p style={{ fontSize: 13, color: 'var(--color-text-faint)', marginBottom: 12 }}>Danger zone</p>
            <button
              style={{
                padding: '9px 18px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(248,81,73,0.3)',
                background: 'rgba(248,81,73,0.06)',
                color: 'var(--color-red)',
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
              }}
              onClick={() => alert('Backend wiring pending — delete account flow')}
            >
              Delete account and all data
            </button>
          </div>
        </div>
      </section>

      {/* Password change modal */}
      {passwordModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={closePasswordModal}
        >
          <div
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              width: '100%',
              maxWidth: 400,
              boxShadow: 'var(--shadow-card)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Change password</h3>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 20 }}>
              Enter your new password below.
            </p>
            <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {passwordError && (
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(248,81,73,0.1)',
                    border: '1px solid rgba(248,81,73,0.3)',
                    color: 'var(--color-red)',
                    fontSize: 13,
                  }}
                  role="alert"
                >
                  {passwordError}
                </div>
              )}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text-faint)', marginBottom: 6 }}>
                  New password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-surface-2)',
                    color: 'var(--color-text-primary)',
                    fontSize: 13,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  autoFocus
                  disabled={passwordMutation.isPending}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text-faint)', marginBottom: 6 }}>
                  Confirm password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-surface-2)',
                    color: 'var(--color-text-primary)',
                    fontSize: 13,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  disabled={passwordMutation.isPending}
                />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={closePasswordModal}
                  className="btn-ghost"
                  style={{ fontSize: 14, padding: '10px 20px', cursor: 'pointer', flexShrink: 0 }}
                  disabled={passwordMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordMutation.isPending}
                  className="btn-primary"
                  style={{ fontSize: 14, padding: '10px 20px', cursor: passwordMutation.isPending ? 'not-allowed' : 'pointer', opacity: passwordMutation.isPending ? 0.6 : 1, flexShrink: 0 }}
                >
                  {passwordMutation.isPending ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}