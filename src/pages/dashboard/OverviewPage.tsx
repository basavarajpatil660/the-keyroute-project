import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { EmptyState } from '../../components/EmptyState'

const IconRequests = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="9,1 2,9 7,9 6,15 14,6 9,6" />
  </svg>
)
const IconKeysStat = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="6" cy="7" r="3.5" />
    <path d="M9 9.5L14 14.5" />
    <line x1="11" y1="11.5" x2="13" y2="13.5" />
  </svg>
)
const IconProviders = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M8 1L14.5 4.5V11.5L8 15L1.5 11.5V4.5L8 1Z" />
    <path d="M1.5 4.5L8 8L14.5 4.5" />
    <line x1="8" y1="8" x2="8" y2="15" />
  </svg>
)
const IconLatency = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="8" cy="8" r="6.5" />
    <path d="M8 4.5V8L10.5 9.5" />
  </svg>
)

interface RecentRequestRow {
  id: string
  model: string
  provider: string
  label_used: string | null
  status_code: number
  latency_ms: number | null
  created_at: string
}

interface OverviewStats {
  requestsToday: number
  activeKeys: number
  providers: number
  avgLatencyMs: number | null
  p50LatencyMs: number | null
  p95LatencyMs: number | null
}

interface OverviewData {
  stats: OverviewStats
  recent: RecentRequestRow[]
}

/**
 * Nearest-rank percentile on a sorted array. p95 in particular matters
 * more than the average here — a single average can look perfectly fine
 * while a meaningful chunk of requests are actually slow; p95 tells you
 * "19 out of 20 requests finish this fast or faster," which is what
 * actually shows up as a slow experience for real users.
 */
function percentile(sortedAsc: number[], p: number): number | null {
  if (sortedAsc.length === 0) return null
  const rank = Math.ceil((p / 100) * sortedAsc.length) - 1
  const clamped = Math.min(Math.max(rank, 0), sortedAsc.length - 1)
  return sortedAsc[clamped]
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

async function fetchOverview(): Promise<OverviewData> {
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const [todayLogsRes, keyLabelsRes, recentRes] = await Promise.all([
    supabase
      .from('usage_logs')
      .select('latency_ms')
      .gte('created_at', startOfToday.toISOString()),
    supabase
      .from('key_labels')
      .select('provider')
      .eq('is_active', true),
    supabase
      .from('usage_logs')
      .select('id, model, provider, label_used, status_code, latency_ms, created_at')
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const todayLogsErr = todayLogsRes.error
  const keyLabelsErr = keyLabelsRes.error
  const recentErr = recentRes.error

  if (todayLogsErr || keyLabelsErr || recentErr) {
    const msg = todayLogsErr?.message ?? keyLabelsErr?.message ?? recentErr?.message ?? 'Failed to load overview data'
    throw new Error(msg)
  }

  const todayLogs = todayLogsRes.data ?? []
  const keyLabels = keyLabelsRes.data ?? []
  const recentLogs = (recentRes.data ?? []) as RecentRequestRow[]

  const latencies = todayLogs
    .map(l => l.latency_ms)
    .filter((v): v is number => v !== null)
    .sort((a, b) => a - b)

  return {
    stats: {
      requestsToday: todayLogs.length,
      activeKeys: keyLabels.length,
      providers: new Set(keyLabels.map(k => k.provider)).size,
      avgLatencyMs: latencies.length > 0
        ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
        : null,
      p50LatencyMs: percentile(latencies, 50),
      p95LatencyMs: percentile(latencies, 95),
    },
    recent: recentLogs,
  }
}

export function OverviewPage() {
  const [refreshing, setRefreshing] = useState(false)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['overview'],
    queryFn: fetchOverview,
  })

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }, [refetch])

  const stats = data?.stats ?? null
  const recent = data?.recent ?? []

  const STATS = [
    { label: 'Requests today', value: isLoading ? '-' : isError ? 'Error' : String(stats?.requestsToday ?? 0), Icon: IconRequests },
    { label: 'Active keys', value: isLoading ? '-' : isError ? 'Error' : String(stats?.activeKeys ?? 0), Icon: IconKeysStat },
    { label: 'Providers', value: isLoading ? '-' : isError ? 'Error' : String(stats?.providers ?? 0), Icon: IconProviders },
    { label: 'Avg latency', value: isLoading ? '-' : isError ? 'Error' : (stats?.avgLatencyMs != null ? `${stats.avgLatencyMs}ms` : '—'), Icon: IconLatency },
    { label: 'p50 latency', value: isLoading ? '-' : isError ? 'Error' : (stats?.p50LatencyMs != null ? `${stats?.p50LatencyMs}ms` : '—'), Icon: IconLatency },
    { label: 'p95 latency', value: isLoading ? '-' : isError ? 'Error' : (stats?.p95LatencyMs != null ? `${stats?.p95LatencyMs}ms` : '—'), Icon: IconLatency },
  ]

  return (
    <div>
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 26, marginBottom: 4 }}>Overview</h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>
            Your Keyroute gateway at a glance.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing || isLoading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface-2)',
            color: 'var(--color-text-primary)',
            fontSize: 13,
            fontWeight: 500,
            fontFamily: 'var(--font-body)',
            cursor: refreshing || isLoading ? 'not-allowed' : 'pointer',
            opacity: refreshing || isLoading ? 0.6 : 1,
          }}
        >
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }}
          >
            <path d="M23 4v6h-6" />
            <path d="M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 16,
          marginBottom: 32,
        }}
      >
        {STATS.map(stat => {
          const isStatError = isError && stat.value === 'Error'
          return (
            <div key={stat.label} className="surface-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 26,
                    height: 26,
                    borderRadius: 7,
                    background: isStatError ? 'rgba(248,81,73,0.1)' : 'var(--color-surface-2)',
                    border: isStatError ? '1px solid rgba(248,81,73,0.3)' : '1px solid var(--color-border)',
                    color: isStatError ? 'var(--color-red)' : 'var(--color-indigo)',
                    flexShrink: 0,
                  }}
                >
                  <stat.Icon />
                </div>
                <p style={{ fontSize: 12, color: 'var(--color-text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {stat.label}
                </p>
              </div>
              <p style={{ fontSize: 28, fontFamily: 'var(--font-display)', fontWeight: 700, color: isLoading ? 'var(--color-text-muted)' : isStatError ? 'var(--color-red)' : 'var(--color-text-primary)' }}>
                {isLoading ? <span className="skeleton-bar" style={{ display: 'inline-block', height: 24, width: 48, verticalAlign: 'middle' }} /> : stat.value}
              </p>
            </div>
          )
        })}
      </div>

      <div className="surface-card" style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border-muted)' }}>
          <h2 style={{ fontSize: 15, fontWeight: 600 }}>Recent requests</h2>
        </div>

        {isError ? (
          <div style={{ padding: '32px 20px', textAlign: 'center' }}>
            <p style={{ color: 'var(--color-red)', marginBottom: 16, fontSize: 14 }}>{(error as Error).message}</p>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="btn-primary"
              style={{ fontSize: 13, padding: '10px 20px' }}
            >
              {refreshing ? 'Retrying…' : 'Retry'}
            </button>
          </div>
        ) : !isLoading && recent.length > 0 ? (
          <div>
            {recent.map(r => (
              <div
                key={r.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '100px 120px 1fr 90px 70px',
                  gap: 12,
                  padding: '12px 20px',
                  borderBottom: '1px solid var(--color-border-muted)',
                  fontSize: 13,
                  alignItems: 'center',
                }}
              >
                <span style={{ color: 'var(--color-text-faint)' }}>{timeAgo(r.created_at)}</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-indigo)', fontWeight: 600 }}>{r.label_used ?? '—'}</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>{r.model}</span>
                <span style={{ color: 'var(--color-text-muted)' }}>{r.latency_ms != null ? `${r.latency_ms}ms` : '—'}</span>
                <span style={{ color: r.status_code >= 200 && r.status_code < 300 ? 'var(--color-green)' : 'var(--color-red)', fontWeight: 600 }}>
                  {r.status_code}
                </span>
              </div>
            ))}
          </div>
        ) : !isLoading ? (
          <EmptyState
            icon={<IconRequests />}
            title="No requests yet"
            description="Make your first routed API call and usage will appear here."
            action={
              <a
                href="/docs"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '10px 20px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(240,165,0,0.1)',
                  border: '1px solid rgba(240,165,0,0.25)',
                  color: 'var(--color-amber)',
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                View quickstart →
              </a>
            }
          />
        ) : (
          [0, 1, 2, 3].map(i => (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '100px 120px 1fr 90px 70px',
                gap: 12,
                padding: '12px 20px',
                borderBottom: '1px solid var(--color-border-muted)',
                alignItems: 'center',
              }}
            >
              <span className="skeleton-bar" style={{ height: 12, width: '70%' }} />
              <span className="skeleton-bar" style={{ height: 12, width: '60%' }} />
              <span className="skeleton-bar" style={{ height: 12, width: '80%' }} />
              <span className="skeleton-bar" style={{ height: 12, width: '50%' }} />
              <span className="skeleton-bar" style={{ height: 12, width: '40%' }} />
            </div>
          ))
        )}
      </div>
    </div>
  )
}