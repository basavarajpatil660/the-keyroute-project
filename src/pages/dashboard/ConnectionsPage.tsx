import { useState, useRef, type ReactElement } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { provisionOwnerAccount } from '../../lib/owner'
import { CodeBlock } from '../../components/CodeBlock'

interface ConnectionRow {
  id: string
  project_url: string
  is_active: boolean
  created_at: string
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message
  if (err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
    return (err as { message: string }).message
  }
  return fallback
}

// Pulls the 20-char project ref out of a project URL like
// https://<ref>.supabase.co — returns null if it doesn't look like one.
function extractProjectRef(projectUrl: string): string | null {
  try {
    const hostname = new URL(projectUrl.trim()).hostname
    const match = hostname.match(/^([a-z0-9]{20})\.supabase\.co$/)
    return match ? match[1] : null
  } catch {
    return null
  }
}

function gatewayFunctionUrl(ref: string): string {
  return `https://${ref}.supabase.co/functions/v1/gateway`
}

// The one-time self-host provisioning steps, run by the user in a terminal.
// Everything here talks to Supabase via its own CLI — no backend of ours is
// involved, so this works no matter where (or whether) the dashboard itself
// is hosted.
const CLI_STEPS: { title: string; note: string; command: string }[] = [
  {
    title: 'Log in to Supabase',
    note: 'Opens a browser window to authenticate the CLI with your Supabase account.',
    command: 'npx supabase login',
  },
  {
    title: 'Link this repo to your project',
    note: 'One-time. Replace your-project-ref with the 20-character ref from your project URL (https://<ref>.supabase.co).',
    command: 'npx supabase link --project-ref your-project-ref',
  },
  {
    title: 'Apply the database migrations',
    note: 'Runs every SQL file in supabase/migrations against your project, in order. Safe to re-run.',
    command: 'npx supabase db push',
  },
  {
    title: 'Deploy the gateway function',
    note: 'Publishes supabase/functions/gateway into your project. --no-verify-jwt lets callers authenticate with platform keys instead of Supabase JWTs.',
    command: 'npx supabase functions deploy gateway --no-verify-jwt',
  },
  {
    title: 'Apply project settings',
    note: "Pushes supabase/config.toml to your project — including email-confirmations-off, which the silent owner account needs so it can sign up without clicking a confirmation link.",
    command: 'npx supabase config push',
  },
]

async function fetchConnection(): Promise<ConnectionRow | null> {
  const { data, error } = await supabase
    .from('supabase_connections')
    .select('id, project_url, is_active, created_at')
    .eq('is_active', true)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data as ConnectionRow | null
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)',
  background: 'var(--color-surface-2)',
  color: 'var(--color-text-primary)',
  fontSize: 14,
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

const DisconnectIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 19h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-12a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z" />
    <path d="M14 13h-4" />
    <path d="M14 9h-4" />
    <path d="M6 13H2" />
    <path d="M6 9H2" />
  </svg>
)

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const ProviderIcon = ({ name }: { name: string }) => {
  const icons: Record<string, ReactElement> = {
    Railway: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 21h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2z" />
        <path d="M12 3v18" />
        <path d="M3 9h18" />
        <path d="M3 15h18" />
      </svg>
    ),
    Neon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
        <path d="M12 2v20" />
        <path d="M2 8.5h20" />
        <path d="M2 15.5h20" />
      </svg>
    ),
    PlanetScale: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2v4" />
        <path d="M12 18v4" />
        <path d="M4.93 4.93l2.83 2.83" />
        <path d="M16.24 16.24l2.83 2.83" />
        <path d="M2 12h4" />
        <path d="M18 12h4" />
        <path d="M4.93 19.07l2.83-2.83" />
        <path d="M16.24 7.76l2.83-2.83" />
      </svg>
    ),
  }
  return icons[name] || (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <path d="M8 21h8" />
      <path d="M12 17v4" />
    </svg>
  )
}

export function ConnectionsPage() {
  const queryClient = useQueryClient()
  const [projectUrl, setProjectUrl] = useState('')
  const [serviceKey, setServiceKey] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [editingConnection, setEditingConnection] = useState(false)
  const [editServiceKey, setEditServiceKey] = useState('')
  const editPanelRef = useRef<HTMLDivElement>(null)

  // Finish-setup state. provisionOwnerAccount() creates the silent owner
  // auth user for this install and signs this browser in as it — the same
  // call the old one-click deploy used to make at the end of its chain.
  const [finishResult, setFinishResult] = useState<{ ok: boolean; text: string } | null>(null)
  const [finishing, setFinishing] = useState(false)

  const { data: connection, isLoading, isError, error } = useQuery({
    queryKey: ['connection'],
    queryFn: fetchConnection,
  })

  const connectMutation = useMutation({
    mutationFn: async ({ projectUrl, serviceKey }: { projectUrl: string; serviceKey: string }) => {
      const { error } = await supabase.rpc('upsert_supabase_connection', {
        p_project_url: projectUrl.trim(),
        p_service_key: serviceKey.trim(),
      })
      if (error) throw error
    },
    onSuccess: () => {
      setMessage({ type: 'success', text: 'Supabase project connected.' })
      setProjectUrl('')
      setServiceKey('')
      queryClient.invalidateQueries({ queryKey: ['connection'] })
    },
    onError: (err) => {
      setMessage({ type: 'error', text: getErrorMessage(err, 'Failed to connect') })
    },
  })

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('disconnect_supabase_connection')
      if (error) throw error
    },
    onSuccess: () => {
      setMessage({ type: 'success', text: 'Supabase project disconnected.' })
      queryClient.invalidateQueries({ queryKey: ['connection'] })
    },
    onError: (err) => {
      setMessage({ type: 'error', text: getErrorMessage(err, 'Failed to disconnect') })
    },
  })

  const editMutation = useMutation({
    mutationFn: async ({ projectUrl, serviceKey }: { projectUrl: string; serviceKey: string }) => {
      const { error } = await supabase.rpc('upsert_supabase_connection', {
        p_project_url: projectUrl,
        p_service_key: serviceKey.trim(),
      })
      if (error) throw error
    },
    onSuccess: () => {
      setMessage({ type: 'success', text: 'Service key updated.' })
      setEditingConnection(false)
      setEditServiceKey('')
      queryClient.invalidateQueries({ queryKey: ['connection'] })
    },
    onError: (err) => {
      setMessage({ type: 'error', text: getErrorMessage(err, 'Failed to update service key') })
    },
  })

  const handleFinishSetup = async () => {
    setFinishResult(null)
    setFinishing(true)
    try {
      const owner = await provisionOwnerAccount()
      const url = connection?.project_url ?? projectUrl
      const ref = extractProjectRef(url)
      setFinishResult({
        ok: true,
        text: `Signed in silently as ${owner.email}.${ref ? ` Your gateway is live at ${gatewayFunctionUrl(ref)}` : ''}`,
      })
    } catch (err) {
      setFinishResult({ ok: false, text: getErrorMessage(err, 'Could not create the owner account') })
    } finally {
      setFinishing(false)
    }
  }

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (!projectUrl.trim() || !serviceKey.trim()) {
      setMessage({ type: 'error', text: 'Both project URL and service key are required.' })
      return
    }

    connectMutation.mutate({ projectUrl, serviceKey })
  }

  const handleDisconnect = () => {
    if (!window.confirm('Disconnect Supabase project? This will remove the connection and you will need to reconnect to use encrypted key storage.')) return
    setMessage(null)
    disconnectMutation.mutate()
  }

  const openEditConnection = () => {
    if (!connection) return
    setEditingConnection(true)
    setEditServiceKey('')
  }

  const closeEditConnection = () => {
    setEditingConnection(false)
    setEditServiceKey('')
  }

  const saveEditConnection = () => {
    if (!connection || !editServiceKey.trim()) {
      setMessage({ type: 'error', text: 'Service key is required.' })
      return
    }

    setMessage(null)
    editMutation.mutate({ projectUrl: connection.project_url, serviceKey: editServiceKey })
  }

  const renderComingSoonProviders = () => (
    <div style={{ marginTop: 24 }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 12 }}>
        More providers coming soon
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        {['Railway', 'Neon', 'PlanetScale'].map(provider => (
          <div
            key={provider}
            style={{
              padding: '20px 16px',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border-muted)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 10,
              opacity: 0.5,
              cursor: 'not-allowed',
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 'var(--radius-lg)',
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-text-faint)',
              }}
            >
              <ProviderIcon name={provider} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-muted)' }}>{provider}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-amber)', background: 'rgba(232,160,32,0.12)', padding: '3px 8px', borderRadius: 'var(--radius-sm)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Coming soon
            </span>
          </div>
        ))}
      </div>
    </div>
  )

  const renderConnectionCard = () => {
    if (!connection) return null

    return (
      <div
        className="surface-card"
        style={{ padding: 24, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: connection.is_active ? 'var(--color-green)' : 'var(--color-text-faint)', flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>{connection.project_url}</p>
            <p style={{ fontSize: 12, color: 'var(--color-text-faint)' }}>
              {connection.is_active ? 'Connected' : 'Inactive'} · since {new Date(connection.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={openEditConnection}
            title="Edit service key"
            aria-label="Edit service key"
            style={{
              ...iconButtonHoverStyle,
              color: 'var(--color-indigo)',
              background: 'rgba(99,102,241,0.1)',
              padding: '8px 12px',
              gap: 6,
            }}
            onMouseEnter={e => Object.assign(e.currentTarget.style, { ...iconButtonHoverStyle, color: 'var(--color-indigo)', background: 'rgba(99,102,241,0.15)' })}
            onMouseLeave={e => Object.assign(e.currentTarget.style, { ...iconButtonStyle, color: 'var(--color-indigo)', background: 'rgba(99,102,241,0.1)' })}
          >
            <EditIcon />
            <span style={{ fontSize: 13, fontWeight: 500 }}>Edit</span>
          </button>
          <button
            onClick={handleDisconnect}
            style={{
              ...iconButtonHoverStyle,
              color: 'var(--color-red)',
              background: 'rgba(248,81,73,0.1)',
              gap: 6,
              padding: '8px 12px',
            }}
            onMouseEnter={e => Object.assign(e.currentTarget.style, { ...iconButtonHoverStyle, color: 'var(--color-red)', background: 'rgba(248,81,73,0.15)' })}
            onMouseLeave={e => Object.assign(e.currentTarget.style, { ...iconButtonStyle, color: 'var(--color-red)', background: 'rgba(248,81,73,0.1)' })}
          >
            <DisconnectIcon />
            <span style={{ fontSize: 13, fontWeight: 500 }}>Disconnect</span>
          </button>
        </div>

        {editingConnection && (
          <div
            ref={editPanelRef}
            style={{
              width: '100%',
              marginTop: 16,
              paddingTop: 16,
              borderTop: '1px solid var(--color-border-muted)',
            }}
          >
            <div style={{ maxWidth: 420 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700 }}>Update service key</h4>
                <button
                  onClick={closeEditConnection}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--color-text-muted)', display: 'inline-flex' }}
                  aria-label="Close"
                >
                  <CloseIcon />
                </button>
              </div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text-faint)', marginBottom: 6 }}>
                Service key (stored encrypted)
              </label>
              <input
                type="password"
                value={editServiceKey}
                onChange={e => setEditServiceKey(e.target.value)}
                placeholder="Enter new service key"
                style={inputStyle}
              />
              {message && (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: message.type === 'success' ? 'rgba(63,185,80,0.1)' : 'rgba(248,81,73,0.1)',
                    border: `1px solid ${message.type === 'success' ? 'rgba(63,185,80,0.3)' : 'rgba(248,81,73,0.3)'}`,
                    color: message.type === 'success' ? 'var(--color-green)' : 'var(--color-red)',
                    fontSize: 13,
                    lineHeight: 1.5,
                    marginTop: 12,
                  }}
                  role="alert"
                >
                  {message.text}
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button
                  onClick={closeEditConnection}
                  className="btn-ghost"
                  style={{ flex: 1, fontSize: 14, padding: '10px 0', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={saveEditConnection}
                  disabled={editMutation.isPending || !editServiceKey.trim()}
                  className="btn-primary"
                  style={{ flex: 1, fontSize: 14, padding: '10px 0', cursor: editMutation.isPending ? 'not-allowed' : 'pointer', opacity: editMutation.isPending ? 0.6 : 1 }}
                >
                  {editMutation.isPending ? 'Saving…' : 'Save'}
                </button>
              </div>
              <p style={{ fontSize: 12, color: 'var(--color-text-faint)', textAlign: 'center', lineHeight: 1.6, marginTop: 12 }}>
                Calls <code>upsert_supabase_connection</code> RPC · Service key is AES-encrypted before storage
              </p>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderConnectForm = () => (
    <div className="surface-card" style={{ padding: 28, marginBottom: 20 }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Connect your Supabase project</h3>
      <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16 }}>
        Your credentials stay in your instance — Keyroute stores only an encrypted reference.
      </p>
      <form onSubmit={handleConnect} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 420 }}>
        <input
          value={projectUrl}
          onChange={e => setProjectUrl(e.target.value)}
          placeholder="https://your-project.supabase.co"
          style={inputStyle}
        />
        <input
          value={serviceKey}
          onChange={e => setServiceKey(e.target.value)}
          type="password"
          placeholder="Service key (stored encrypted)"
          style={inputStyle}
        />

        {message && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              background: message.type === 'success' ? 'rgba(63,185,80,0.1)' : 'rgba(248,81,73,0.1)',
              border: `1px solid ${message.type === 'success' ? 'rgba(63,185,80,0.3)' : 'rgba(248,81,73,0.3)'}`,
              color: message.type === 'success' ? 'var(--color-green)' : 'var(--color-red)',
              fontSize: 13,
              lineHeight: 1.5,
            }}
            role="alert"
          >
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={connectMutation.isPending}
          className="btn-primary"
          style={{ width: '100%', textAlign: 'center', opacity: connectMutation.isPending ? 0.6 : 1, cursor: connectMutation.isPending ? 'not-allowed' : 'pointer', fontSize: 14 }}
        >
          {connectMutation.isPending ? 'Connecting…' : 'Connect'}
        </button>
        <p style={{ fontSize: 12, color: 'var(--color-text-faint)', textAlign: 'center', lineHeight: 1.6 }}>
          Calls <code>upsert_supabase_connection</code> RPC · Service key is AES-encrypted before storage
        </p>
      </form>
    </div>
  )

  const renderSetupGuideCard = () => {
    const effectiveUrl = connection?.project_url ?? projectUrl
    const ref = extractProjectRef(effectiveUrl)

    return (
      <div className="surface-card" style={{ padding: 28, marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Set up with the Supabase CLI</h3>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16, lineHeight: 1.6 }}>
          Run these commands once from the repo root to provision everything into your own
          Supabase project. After that your gateway runs permanently at{' '}
          <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
            https://&lt;your-ref&gt;.supabase.co/functions/v1/gateway
          </code>{' '}
          — no backend of ours (or anyone's) sits in between.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 640 }}>
          {CLI_STEPS.map((step, i) => (
            <div key={step.command}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: 'var(--color-amber)' }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>{step.title}</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--color-text-faint)', lineHeight: 1.6, margin: '0 0 8px 30px' }}>
                {step.note}
              </p>
              <div style={{ margin: '0 0 0 30px' }}>
                <CodeBlock language="bash" code={step.command} />
              </div>
            </div>
          ))}

          <div style={{ borderTop: '1px solid var(--color-border-muted)', paddingTop: 16 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>Finish setup</span>
            <p style={{ fontSize: 12, color: 'var(--color-text-faint)', lineHeight: 1.6, margin: '4px 0 10px' }}>
              Once all five commands have run and this dashboard is configured with your project URL +
              anon key (via <code>.env.local</code> or your host's environment settings), click below. It
              provisions this install's silent owner account and signs you in — no login form, no email.
            </p>
            <button
              onClick={handleFinishSetup}
              disabled={finishing}
              className="btn-primary"
              style={{
                width: '100%',
                textAlign: 'center',
                fontSize: 14,
                opacity: finishing ? 0.6 : 1,
                cursor: finishing ? 'not-allowed' : 'pointer',
              }}
            >
              {finishing ? 'Creating owner account…' : 'Create owner account & sign in'}
            </button>

            {finishResult && (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: finishResult.ok ? 'rgba(63,185,80,0.1)' : 'rgba(248,81,73,0.1)',
                  border: `1px solid ${finishResult.ok ? 'rgba(63,185,80,0.3)' : 'rgba(248,81,73,0.3)'}`,
                  color: finishResult.ok ? 'var(--color-green)' : 'var(--color-red)',
                  fontSize: 13,
                  lineHeight: 1.5,
                  marginTop: 12,
                  wordBreak: 'break-word',
                }}
                role="alert"
              >
                {finishResult.text}
              </div>
            )}

            {ref && (
              <p style={{ fontSize: 12, color: 'var(--color-text-faint)', lineHeight: 1.6, marginTop: 12 }}>
                Gateway URL for this project:{' '}
                <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-text-muted)' }}>
                  {gatewayFunctionUrl(ref)}
                </code>
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderInfoPanel = () => (
    <div
      style={{
        padding: '16px 20px',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border-muted)',
        borderLeft: '3px solid var(--color-indigo)',
        borderRadius: 'var(--radius-md)',
        fontSize: 13,
        color: 'var(--color-text-muted)',
        lineHeight: 1.7,
      }}
    >
      <strong style={{ color: 'var(--color-text-primary)' }}>How this works:</strong>{' '}
      Your Supabase service key is encrypted using Supabase Vault and stored as ciphertext. Only a security-definer RPC function inside your Supabase instance can decrypt it — not the Keyroute application layer.
    </div>
  )

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, marginBottom: 4 }}>Connections</h1>
        <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>
          Connect your Supabase project to enable encrypted key storage.
        </p>
      </div>

      {isError ? (
        <>
          {/* Expected on a brand-new project (migrations not applied yet) —
              shown as a soft note so it never blocks the CLI setup guide,
              whose `db push` step is what applies those migrations. */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(248,81,73,0.08)',
              border: '1px solid rgba(248,81,73,0.25)',
              color: 'var(--color-text-muted)',
              fontSize: 13,
              lineHeight: 1.6,
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <span>Couldn't read connection state{(error as Error)?.message ? `: ${(error as Error).message}` : ''}.</span>
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ['connection'] })}
              className="btn-ghost"
              style={{ fontSize: 12, padding: '6px 14px', flexShrink: 0 }}
            >
              Retry
            </button>
          </div>
          {renderConnectForm()}
          {renderSetupGuideCard()}
          {renderComingSoonProviders()}
          {renderInfoPanel()}
        </>
      ) : !isLoading && connection ? (
        <>
          {renderConnectionCard()}
          {renderSetupGuideCard()}
          {renderInfoPanel()}
        </>
      ) : !isLoading && !connection ? (
        <>
          {renderConnectForm()}
          {renderSetupGuideCard()}
          {renderComingSoonProviders()}
          {renderInfoPanel()}
        </>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', minHeight: 200 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-indigo)', animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>Loading…</span>
          </div>
          <style>{`
            @keyframes spin { to { transform: rotate(360deg); } }
          `}</style>
        </div>
      )}
    </div>
  )
}