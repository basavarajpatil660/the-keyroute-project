import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { BarChart, Legend } from '../../components/charts/BarChart'
import { EmptyState } from '../../components/EmptyState'

const DEFAULT_RANGE_DAYS = 30

interface ActivitySummary {
  total_requests: number
  total_tokens: number
  success_rate: number
  avg_latency_ms: number | null
  time_series: Array<{
    bucket: string
    requests: number
    prompt_tokens: number
    completion_tokens: number
  }>
  model_breakdown: Array<{
    bucket: string
    values: Record<string, number>
  }>
  top_labels: Array<{
    label: string
    requests: number
    tokens: number
  }>
  available_models: string[]
}

async function fetchActivitySummary(
  rangeDays: number,
  model: string | null,
  granularity: 'day' | 'hour'
): Promise<ActivitySummary> {
  const { data, error } = await supabase.rpc('get_activity_summary', {
    p_range_days: rangeDays,
    p_model: model,
    p_granularity: granularity,
  })
  if (error) throw new Error(error.message)
  return data as ActivitySummary
}

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return String(n)
}

function formatBucketLabel(bucket: string, granularity: 'day' | 'hour'): string {
  const date = new Date(bucket)
  if (granularity === 'hour') {
    return date.toLocaleTimeString(undefined, { hour: 'numeric', hour12: true })
  }
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

const IconActivity = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="1,12 5,7 8,10 11,5 15,3" />
    <line x1="1" y1="12" x2="15" y2="12" />
  </svg>
)

const IconRequests = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="9,1 2,9 7,9 6,15 14,6 9,6" />
  </svg>
)
const IconTokens = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="3" width="12" height="10" rx="2" />
    <line x1="5" y1="7" x2="11" y2="7" />
    <line x1="5" y1="11" x2="8" y2="11" />
  </svg>
)
const IconSuccess = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M13 3L5 11l-3-3" />
    <circle cx="8" cy="8" r="7" />
  </svg>
)
const IconLatency = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="8" cy="8" r="6.5" />
    <path d="M8 4.5V8L10.5 9.5" />
  </svg>
)

export function ActivityPage() {
  const [rangeDays, setRangeDays] = useState(DEFAULT_RANGE_DAYS)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedModel, setSelectedModel] = useState<string>('all')

  const granularity = rangeDays === 0 ? 'hour' : 'day'
  const effectiveModel = selectedModel === 'all' ? null : selectedModel
  const rpcRangeDays = rangeDays === 0 ? 7 : rangeDays

  const { data: summary, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['activity', rangeDays, effectiveModel, granularity],
    queryFn: () => fetchActivitySummary(rpcRangeDays, effectiveModel, granularity),
  })

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }, [refetch])

  const availableModels = summary?.available_models ?? []

  const STATS = [
    {
      label: 'Total requests',
      value: isLoading ? '-' : isError ? 'Error' : formatNumber(summary?.total_requests ?? 0),
      Icon: IconRequests,
    },
    {
      label: 'Total tokens',
      value: isLoading ? '-' : isError ? 'Error' : formatNumber(summary?.total_tokens ?? 0),
      Icon: IconTokens,
    },
    {
      label: 'Success rate',
      value: isLoading ? '-' : isError ? 'Error' : `${Math.round(summary?.success_rate ?? 0)}%`,
      Icon: IconSuccess,
    },
    {
      label: 'Avg latency',
      value:
        isLoading
          ? '-'
          : isError
          ? 'Error'
          : summary?.avg_latency_ms != null
          ? `${summary.avg_latency_ms}ms`
          : '—',
      Icon: IconLatency,
    },
  ]

  const requestsOverTimeData = summary?.time_series.map((ts) => ({
    label: formatBucketLabel(ts.bucket, granularity),
    value: ts.requests,
  })) ?? []

  const tokenBreakdownData = summary?.time_series.map((ts) => ({
    label: formatBucketLabel(ts.bucket, granularity),
    values: {
      'Prompt tokens': ts.prompt_tokens,
      'Completion tokens': ts.completion_tokens,
    },
  })) ?? []

  const modelBreakdownData = summary?.model_breakdown.map((mb) => ({
    label: formatBucketLabel(mb.bucket, granularity),
    values: mb.values,
  })) ?? []

  const modelSeries = Array.from(
    new Set(modelBreakdownData.flatMap((d) => Object.keys(d.values)))
  ).sort()

  const MODEL_CHART_COLORS = [
    'var(--color-indigo)',
    'var(--color-amber)',
    'var(--color-text-muted)',
    'color-mix(in srgb, var(--color-indigo) 55%, white)',
    'color-mix(in srgb, var(--color-amber) 55%, white)',
    'color-mix(in srgb, var(--color-indigo) 45%, black)',
  ]

  const topLabelsData = summary?.top_labels ?? []

  return (
    <div>
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, marginBottom: 4 }}>Activity</h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>
            Trends and analytics from your <code>usage_logs</code> table.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <select
            value={selectedModel}
            onChange={e => setSelectedModel(e.target.value)}
            disabled={isLoading}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface-2)',
              color: selectedModel !== 'all' ? 'var(--color-indigo)' : 'var(--color-text-primary)',
              fontSize: 13,
              fontFamily: 'var(--font-mono)',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
              maxWidth: 220,
            }}
          >
            <option value="all">All models</option>
            {availableModels.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <select
            value={rangeDays}
            onChange={e => setRangeDays(Number(e.target.value))}
            disabled={isLoading}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface-2)',
              color: 'var(--color-text-primary)',
              fontSize: 13,
              fontFamily: 'var(--font-body)',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            <option value={0}>Today</option>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
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
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
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
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 16,
          marginBottom: 32,
        }}
      >
        {STATS.map((stat) => {
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
                {isLoading ? (
                  <span className="skeleton-bar" style={{ display: 'inline-block', height: 24, width: 48, verticalAlign: 'middle' }} />
                ) : (
                  stat.value
                )}
              </p>
            </div>
          )
        })}
      </div>

      {isError ? (
        <div className="surface-card" style={{ padding: '32px 20px', textAlign: 'center' }}>
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
      ) : !isLoading && (summary?.time_series?.length === 0 || summary?.time_series.every((ts) => ts.requests === 0)) ? (
        <div className="surface-card" style={{ padding: '64px 32px', textAlign: 'center' }}>
          <EmptyState
            icon={<IconActivity />}
            title="No activity data"
            description="Make some routed API calls and usage logs will appear here."
          />
        </div>
      ) : (
        <>
          <section className="surface-card" style={{ padding: '20px', marginBottom: 24 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
              Requests over time{selectedModel !== 'all' && (
                <span style={{ fontWeight: 400, color: 'var(--color-text-faint)', fontFamily: 'var(--font-mono)', fontSize: 13 }}> · {selectedModel}</span>
              )}
            </h2>
            {isLoading ? (
              <BarChart
                data={Array.from({ length: granularity === 'hour' ? new Date().getUTCHours() + 1 : rangeDays }, () => ({ label: '', value: 0 }))}
                height={200}
                colors={['var(--color-indigo)']}
              />
            ) : (
              <>
                <BarChart
                  data={requestsOverTimeData}
                  height={200}
                  colors={['var(--color-indigo)']}
                />
              </>
            )}
          </section>

          <section className="surface-card" style={{ padding: '20px', marginBottom: 24 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
              Token breakdown{selectedModel !== 'all' && (
                <span style={{ fontWeight: 400, color: 'var(--color-text-faint)', fontFamily: 'var(--font-mono)', fontSize: 13 }}> · {selectedModel}</span>
              )}
            </h2>
            <Legend series={['Prompt tokens', 'Completion tokens']} colors={['var(--color-indigo)', 'var(--color-amber)']} />
            {isLoading ? (
              <BarChart
                data={Array.from({ length: granularity === 'hour' ? new Date().getUTCHours() + 1 : rangeDays }, () => ({ label: '', values: { 'Prompt tokens': 0, 'Completion tokens': 0 } }))}
                height={200}
                colors={['var(--color-indigo)', 'var(--color-amber)']}
                seriesKeys={['Prompt tokens', 'Completion tokens']}
              />
            ) : (
              <BarChart
                data={tokenBreakdownData}
                height={200}
                colors={['var(--color-indigo)', 'var(--color-amber)']}
                seriesKeys={['Prompt tokens', 'Completion tokens']}
              />
            )}
          </section>

          <section className="surface-card" style={{ padding: '20px', marginBottom: 24 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Requests by model</h2>
            <p style={{ fontSize: 12, color: 'var(--color-text-faint)', marginBottom: 12 }}>
              Always shows all models, even while a single model is selected above.
            </p>
            <Legend series={modelSeries} colors={MODEL_CHART_COLORS} />
            {isLoading ? (
              <BarChart
                data={Array.from({ length: granularity === 'hour' ? new Date().getUTCHours() + 1 : rangeDays }, () => ({ label: '', values: { 'Model A': 0, 'Model B': 0, 'Other': 0 } }))}
                height={200}
                colors={MODEL_CHART_COLORS}
                seriesKeys={['Model A', 'Model B', 'Other']}
              />
            ) : (
              <BarChart
                data={modelBreakdownData}
                height={200}
                colors={MODEL_CHART_COLORS}
                seriesKeys={modelSeries}
              />
            )}
          </section>

          <section className="surface-card" style={{ padding: '20px' }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Top key labels</h2>
            {isLoading ? (
              [0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 80px 80px',
                    gap: 16,
                    padding: '12px 0',
                    borderBottom: '1px solid var(--color-border-muted)',
                    alignItems: 'center',
                  }}
                >
                  <span className="skeleton-bar" style={{ height: 14, width: '60%' }} />
                  <span className="skeleton-bar" style={{ height: 14, width: '50%', textAlign: 'right' }} />
                  <span className="skeleton-bar" style={{ height: 14, width: '50%', textAlign: 'right' }} />
                </div>
              ))
            ) : topLabelsData.length > 0 ? (
              <div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 80px 80px',
                    gap: 16,
                    padding: '8px 0',
                    borderBottom: '1px solid var(--color-border-muted)',
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--color-text-faint)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                  }}
                >
                  <span>Label</span>
                  <span style={{ textAlign: 'right' }}>Requests</span>
                  <span style={{ textAlign: 'right' }}>Tokens</span>
                </div>
                {topLabelsData.map((item, idx) => (
                  <div
                    key={item.label}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 80px 80px',
                      gap: 16,
                      padding: '12px 0',
                      borderBottom: idx === topLabelsData.length - 1 ? 'none' : '1px solid var(--color-border-muted)',
                      fontSize: 13,
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-indigo)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.label}
                    </span>
                    <span style={{ color: 'var(--color-text-muted)', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                      {formatNumber(item.requests)}
                    </span>
                    <span style={{ color: 'var(--color-text-muted)', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                      {formatNumber(item.tokens)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<IconActivity />}
                title="No key label data"
                description="Usage logs with label_used will populate this list."
              />
            )}
          </section>
        </>
      )}

      <div
        style={{
          marginTop: 20,
          padding: '14px 20px',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border-muted)',
          borderRadius: 'var(--radius-md)',
          fontSize: 12,
          color: 'var(--color-text-faint)',
          fontFamily: 'var(--font-mono)',
          lineHeight: 1.7,
        }}
      >
        Source: <span style={{ color: 'var(--color-text-muted)' }}>usage_logs</span> ·
        Range: <span style={{ color: 'var(--color-text-muted)' }}>{rangeDays === 0 ? 'Today (hourly)' : `${rangeDays} days`}</span> ·
        {selectedModel !== 'all' && (
          <> Model: <span style={{ color: 'var(--color-indigo)' }}>{selectedModel}</span> · </>
        )}
        Granularity: <span style={{ color: 'var(--color-text-muted)' }}>{granularity}</span> ·
        Aggregated server-side via <code>get_activity_summary</code>
      </div>
    </div>
  )
}