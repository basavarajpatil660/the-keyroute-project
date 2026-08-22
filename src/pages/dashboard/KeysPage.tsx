import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'

const PROVIDER_OPTIONS = ['openai', 'gemini', 'groq', 'anthropic', 'custom'] as const

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message
  if (err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
    return (err as { message: string }).message
  }
  return fallback
}

interface KeyLabelRow {
  id: string
  label: string
  provider: string
  custom_base_url: string | null
  created_at: string
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)',
  background: 'var(--color-surface-2)',
  color: 'var(--color-text-primary)',
  fontSize: 13,
  fontFamily: 'var(--font-mono)',
  outline: 'none',
  boxSizing: 'border-box',
}

const iconButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '6px 8px',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--color-text-muted)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'color 0.15s, background 0.15s',
}
const iconButtonHoverStyle: React.CSSProperties = {
  ...iconButtonStyle,
  color: 'var(--color-text-primary)',
  background: 'var(--color-surface-2)',
}

const deleteIconStyle: React.CSSProperties = {
  ...iconButtonStyle,
  color: 'var(--color-text-faint)',
}
const deleteIconHoverStyle: React.CSSProperties = {
  ...iconButtonStyle,
  color: 'var(--color-red)',
  background: 'rgba(248,81,73,0.1)',
}

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)

const RotateIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 4v6h-6" />
    <path d="M1 20v-6h6" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
)

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
)

async function fetchKeys(): Promise<KeyLabelRow[]> {
  const { data, error } = await supabase
    .from('key_labels')
    .select('id, label, provider, custom_base_url, created_at')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as KeyLabelRow[]
}

export function KeysPage() {
  const queryClient = useQueryClient()
  const [label, setLabel] = useState('')
  const [provider, setProvider] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [customBaseUrl, setCustomBaseUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [tableMessage, setTableMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Inline edit state
  const [editingKeyId, setEditingKeyId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')

  // Reset key state
  const [resettingKeyId, setResettingKeyId] = useState<string | null>(null)
  const [resetKeyValue, setResetKeyValue] = useState('')

  const { data: keys = [], isLoading: loadingKeys, isError, error, refetch } = useQuery({
    queryKey: ['keys'],
    queryFn: fetchKeys,
  })

  const addKeyMutation = useMutation({
    mutationFn: async (params: { label: string; provider: string; apiKey: string; customBaseUrl: string }) => {
      const { error } = await supabase.rpc('add_provider_key', {
        p_label: params.label.trim(),
        p_provider: params.provider,
        p_api_key: params.apiKey.trim(),
        p_custom_base_url: params.customBaseUrl.trim() || null,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keys'] })
      setFormMessage({ type: 'success', text: `Key "${label.trim()}" added. Route to it via model: "${label.trim()}/<model-name>".` })
      setLabel('')
      setProvider('')
      setApiKey('')
      setCustomBaseUrl('')
    },
    onError: (err) => {
      const msg = getErrorMessage(err, 'Failed to add key')
      setFormMessage({ type: 'error', text: msg })
    },
  })

  const renameKeyMutation = useMutation({
    mutationFn: async (params: { keyId: string; newLabel: string }) => {
      const { error } = await supabase.rpc('rename_provider_key', {
        p_key_id: params.keyId,
        p_new_label: params.newLabel.trim(),
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keys'] })
      setTableMessage({ type: 'success', text: 'Label updated.' })
    },
    onError: (err) => {
      const msg = getErrorMessage(err, 'Failed to rename key')
      setTableMessage({ type: 'error', text: msg })
    },
  })

  const rotateKeyMutation = useMutation({
    mutationFn: async (params: { keyId: string; newKey: string }) => {
      const { error } = await supabase.rpc('rotate_provider_key', {
        p_key_id: params.keyId,
        p_new_api_key: params.newKey.trim(),
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keys'] })
      setTableMessage({ type: 'success', text: 'Key rotated.' })
    },
    onError: (err) => {
      const msg = getErrorMessage(err, 'Failed to rotate key')
      setTableMessage({ type: 'error', text: msg })
    },
  })

  const deleteKeyMutation = useMutation({
    mutationFn: async (keyId: string) => {
      const { error } = await supabase.rpc('delete_provider_key', {
        p_key_id: keyId,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keys'] })
      setTableMessage({ type: 'success', text: 'Key deleted.' })
    },
    onError: (err) => {
      const msg = getErrorMessage(err, 'Failed to delete key')
      setTableMessage({ type: 'error', text: msg })
    },
  })

  const handleAddKey = (e: React.FormEvent) => {
    e.preventDefault()
    setFormMessage(null)

    if (!label.trim() || !provider || !apiKey.trim()) {
      setFormMessage({ type: 'error', text: 'Label, provider, and API key are all required.' })
      return
    }

    setSubmitting(true)
    addKeyMutation.mutate({ label, provider, apiKey, customBaseUrl })
    setSubmitting(false)
  }

  const startEdit = (key: KeyLabelRow) => {
    setEditingKeyId(key.id)
    setEditLabel(key.label)
  }

  const cancelEdit = () => {
    setEditingKeyId(null)
    setEditLabel('')
  }

  const saveEdit = (keyId: string, newLabel: string) => {
    const trimmed = newLabel.trim()
    if (!trimmed) return
    setTableMessage(null)
    renameKeyMutation.mutate({ keyId, newLabel: trimmed })
    cancelEdit()
  }

  const handleEditKeyDown = (e: React.KeyboardEvent, keyId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      saveEdit(keyId, editLabel)
    } else if (e.key === 'Escape') {
      cancelEdit()
    }
  }

  const startReset = (keyId: string) => {
    setResettingKeyId(keyId)
    setResetKeyValue('')
  }

  const cancelReset = () => {
    setResettingKeyId(null)
    setResetKeyValue('')
  }

  const confirmReset = (keyId: string, newKey: string) => {
    const trimmed = newKey.trim()
    if (!trimmed) return
    setTableMessage(null)
    rotateKeyMutation.mutate({ keyId, newKey: trimmed })
    cancelReset()
  }

  const handleDelete = (keyId: string, keyLabel: string) => {
    if (!window.confirm(`Delete key "${keyLabel}"? This can't be undone.`)) return
    setTableMessage(null)
    deleteKeyMutation.mutate(keyId)
  }

  const ActionButtons = ({ keyId, keyLabel }: { keyId: string; keyLabel: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <button
        onClick={() => startEdit({ id: keyId, label: keyLabel } as KeyLabelRow)}
        style={iconButtonHoverStyle}
        onMouseEnter={e => Object.assign(e.currentTarget.style, iconButtonHoverStyle)}
        onMouseLeave={e => Object.assign(e.currentTarget.style, iconButtonStyle)}
        title="Rename"
        aria-label="Rename"
      >
        <EditIcon />
      </button>
      <button
        onClick={() => startReset(keyId)}
        style={iconButtonHoverStyle}
        onMouseEnter={e => Object.assign(e.currentTarget.style, iconButtonHoverStyle)}
        onMouseLeave={e => Object.assign(e.currentTarget.style, iconButtonStyle)}
        title="Reset key"
        aria-label="Reset key"
      >
        <RotateIcon />
      </button>
      <button
        onClick={() => handleDelete(keyId, keyLabel)}
        style={deleteIconHoverStyle}
        onMouseEnter={e => Object.assign(e.currentTarget.style, deleteIconHoverStyle)}
        onMouseLeave={e => Object.assign(e.currentTarget.style, deleteIconStyle)}
        title="Delete"
        aria-label="Delete"
      >
        <TrashIcon />
      </button>
    </div>
  )

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, marginBottom: 4 }}>Provider Keys</h1>
        <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>
          Add API keys with labels. The label becomes the routing prefix.
        </p>
      </div>

      {/* Table-scoped feedback — sits right above the table so it's near the row that changed */}
      {tableMessage && (
        <div
          style={{
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            background: tableMessage.type === 'success' ? 'rgba(63,185,80,0.1)' : 'rgba(248,81,73,0.1)',
            border: `1px solid ${tableMessage.type === 'success' ? 'rgba(63,185,80,0.3)' : 'rgba(248,81,73,0.3)'}`,
            color: tableMessage.type === 'success' ? 'var(--color-green)' : 'var(--color-red)',
            fontSize: 13,
            lineHeight: 1.5,
            marginBottom: 12,
          }}
          role="alert"
        >
          {tableMessage.text}
        </div>
      )}

      {/* Existing keys table — only rendered once there's at least one */}
      {isError ? (
        <div className="surface-card" style={{ overflow: 'hidden', marginBottom: 20, padding: '32px 20px', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-red)', marginBottom: 16, fontSize: 14 }}>{(error as Error).message}</p>
          <button
            onClick={() => refetch()}
            disabled={loadingKeys}
            className="btn-primary"
            style={{ fontSize: 13, padding: '10px 20px' }}
          >
            {loadingKeys ? 'Retrying…' : 'Retry'}
          </button>
        </div>
      ) : !loadingKeys && keys.length > 0 ? (
        <div className="surface-card" style={{ overflow: 'hidden', marginBottom: 20 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '140px 100px 1fr 140px 80px',
              gap: 16,
              padding: '12px 20px',
              borderBottom: '1px solid var(--color-border-muted)',
              background: 'var(--color-surface-2)',
            }}
          >
            {['Label', 'Provider', 'Endpoint', 'Added', 'Actions'].map(col => (
              <span key={col} style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-faint)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                {col}
              </span>
            ))}
          </div>
          {keys.map(k => (
            <div
              key={k.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '140px 100px 1fr 140px 80px',
                gap: 16,
                padding: '14px 20px',
                borderBottom: '1px solid var(--color-border-muted)',
                fontSize: 13,
                alignItems: 'center',
              }}
            >
              {resettingKeyId === k.id ? (
                <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-indigo)', fontWeight: 600, minWidth: 90 }}>
                    {k.label}
                  </span>
                  <input
                    type="password"
                    value={resetKeyValue}
                    onChange={e => setResetKeyValue(e.target.value)}
                    placeholder="New API key"
                    style={{ ...inputStyle, flex: '1 1 240px', padding: '8px 12px', fontSize: 13 }}
                    autoFocus
                  />
                  <button
                    onClick={() => confirmReset(k.id, resetKeyValue)}
                    className="btn-primary"
                    style={{ padding: '8px 16px', fontSize: 13, whiteSpace: 'nowrap' }}
                  >
                    Confirm
                  </button>
                  <button
                    onClick={cancelReset}
                    style={{ ...iconButtonStyle, padding: '8px 14px', whiteSpace: 'nowrap' }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  {editingKeyId === k.id ? (
                    <input
                      type="text"
                      value={editLabel}
                      onChange={e => setEditLabel(e.target.value)}
                      onBlur={() => saveEdit(k.id, editLabel)}
                      onKeyDown={e => handleEditKeyDown(e, k.id)}
                      style={{ ...inputStyle, padding: '6px 10px', fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-indigo)' }}
                      autoFocus
                    />
                  ) : (
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-indigo)', fontWeight: 600 }}>{k.label}</span>
                  )}
                  <span style={{ textTransform: 'capitalize', color: 'var(--color-text-primary)' }}>{k.provider}</span>
                  <span style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                    {k.custom_base_url || '—'}
                  </span>
                  <span style={{ color: 'var(--color-text-faint)' }}>{new Date(k.created_at).toLocaleDateString()}</span>
                  <ActionButtons keyId={k.id} keyLabel={k.label} />
                </>
              )}
            </div>
          ))}
        </div>
      ) : loadingKeys ? (
        <div className="surface-card" style={{ overflow: 'hidden', marginBottom: 20 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '140px 100px 1fr 140px 80px',
              gap: 16,
              padding: '12px 20px',
              borderBottom: '1px solid var(--color-border-muted)',
              background: 'var(--color-surface-2)',
            }}
          >
            {['Label', 'Provider', 'Endpoint', 'Added', 'Actions'].map(col => (
              <span key={col} style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-faint)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                {col}
              </span>
            ))}
          </div>
          {[0, 1, 2].map(i => (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '140px 100px 1fr 140px 80px',
                gap: 16,
                padding: '14px 20px',
                borderBottom: '1px solid var(--color-border-muted)',
                alignItems: 'center',
              }}
            >
              <span className="skeleton-bar" style={{ height: 13, width: '70%' }} />
              <span className="skeleton-bar" style={{ height: 13, width: '60%' }} />
              <span className="skeleton-bar" style={{ height: 13, width: '85%' }} />
              <span className="skeleton-bar" style={{ height: 13, width: '65%' }} />
              <span className="skeleton-bar" style={{ height: 13, width: '40%' }} />
            </div>
          ))}
        </div>
      ) : (
        <div
          className="surface-card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '64px 32px',
            marginBottom: 20,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-indigo)',
              marginBottom: 16,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
            </svg>
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: 'var(--color-text-primary)' }}>
            No provider keys yet
          </h3>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', maxWidth: 320, lineHeight: 1.6 }}>
            Add your first API key below to start routing requests through Keyroute.
          </p>
        </div>
      )}

      {/* Add key form */}
      <div className="surface-card" style={{ padding: 24, marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Add a provider key</h3>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16 }}>
          Give it a label like "openai-work" or "groq-fast" — that becomes the prefix you use in the model string.
        </p>
        <form onSubmit={handleAddKey} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 480 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <input
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder='Label, e.g. "openai-work"'
              style={inputStyle}
            />
            <select
              value={provider}
              onChange={e => setProvider(e.target.value)}
              style={{ ...inputStyle, color: provider ? 'var(--color-text-primary)' : 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}
            >
              <option value="">Provider</option>
              {PROVIDER_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <input
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            type="password"
            placeholder="API key (encrypted before storage)"
            style={inputStyle}
          />
          <input
            value={customBaseUrl}
            onChange={e => setCustomBaseUrl(e.target.value)}
            placeholder="Custom base URL (optional — only for provider: custom)"
            style={inputStyle}
          />

          {formMessage && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                background: formMessage.type === 'success' ? 'rgba(63,185,80,0.1)' : 'rgba(248,81,73,0.1)',
                border: `1px solid ${formMessage.type === 'success' ? 'rgba(63,185,80,0.3)' : 'rgba(248,81,73,0.3)'}`,
                color: formMessage.type === 'success' ? 'var(--color-green)' : 'var(--color-red)',
                fontSize: 13,
                lineHeight: 1.5,
              }}
              role="alert"
            >
              {formMessage.text}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || addKeyMutation.isPending}
            className="btn-primary"
            style={{ width: '100%', textAlign: 'center', opacity: submitting || addKeyMutation.isPending ? 0.6 : 1, cursor: submitting || addKeyMutation.isPending ? 'not-allowed' : 'pointer', fontSize: 14 }}
          >
            {submitting || addKeyMutation.isPending ? 'Adding…' : 'Add key'}
          </button>
          <p style={{ fontSize: 12, color: 'var(--color-text-faint)', textAlign: 'center', lineHeight: 1.6 }}>
            Encrypted via Supabase Vault on save · Only a secret reference is stored in <code>key_labels</code>
          </p>
        </form>
      </div>

      {/* Routing reminder */}
      <div
        style={{
          padding: '16px 20px',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border-muted)',
          borderLeft: '3px solid var(--color-amber)',
          borderRadius: 'var(--radius-md)',
          fontSize: 13,
          color: 'var(--color-text-muted)',
          lineHeight: 1.7,
        }}
      >
        <strong style={{ color: 'var(--color-text-primary)' }}>Routing format:</strong>{' '}
        Once you add a key with label <code style={{ color: 'var(--color-amber)' }}>openai-work</code>, call it via{' '}
        <code style={{ color: 'var(--color-amber)' }}>model: "openai-work/gpt-4o"</code> in your requests.
      </div>
    </div>
  )
}