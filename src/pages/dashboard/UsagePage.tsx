import { useState, useCallback, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { EmptyState } from '../../components/EmptyState'
import { BarChart, Legend } from '../../components/charts/BarChart'
import { StatCard } from '../../components/StatCard'

interface UsageLogRow {
  id: string
  label_used: string | null
  provider: string
  model: string
  prompt_tokens: number | null
  completion_tokens: number | null
  tokens_estimated: boolean
  status_code: number
  latency_ms: number | null
  created_at: string
}

interface UsagePageResult {
  rows: UsageLogRow[]
  total: number
}

interface UsageSummary {
  total_requests: number
  total_errors: number
  error_rate: number | null
  avg_latency_ms: number | null
  daily_series: Array<{ day: string; requests: number; errors: number }>
}

const DEFAULT_RANGE_DAYS = 7
const PAGE_SIZE_OPTIONS = [24, 48, 100] as const

async function fetchUsageLogsPage(page: number, pageSize: number, rangeDays: number): Promise<UsagePageResult> {
  // rangeDays === 0 means "Today" — must resolve to UTC midnight, not the
  // current instant. `new Date(); since.setDate(since.getDate() - 0)`
  // leaves `since` at the exact current timestamp (time-of-day untouched),
  // which made "Today" query `created_at >= right now` and return almost
  // nothing — even though the stat cards above correctly showed today's
  // real numbers via the RPC's date_trunc('day', now()) logic. This keeps
  // both in agreement.
  const since = rangeDays === 0
    ? new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00.000Z')
    : (() => {
        const d = new Date()
        d.setDate(d.getDate() - rangeDays)
        return d
      })()

  const from = page * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await supabase
    .from('usage_logs')
    .select(
      'id, label_used, provider, model, prompt_tokens, completion_tokens, tokens_estimated, status_code, latency_ms, created_at',
      { count: 'exact' }
    )
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) throw new Error(error.message)
  return { rows: (data ?? []) as UsageLogRow[], total: count ?? 0 }
}

async function fetchUsageSummary(rangeDays: number, granularity: 'day' | 'hour'): Promise<UsageSummary> {
  const { data, error } = await supabase.rpc('get_usage_summary', {
    p_range_days: rangeDays,
    p_granularity: granularity,
  })
  if (error) throw new Error(error.message)
  const summary = Array.isArray(data) ? data[0] : data
  return summary as UsageSummary
}

const IconChevronLeft = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="10,3 5,8 10,13" />
  </svg>
)
const IconChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6,3 11,8 6,13" />
  </svg>
)

export function UsagePage() {
  const [refreshing, setRefreshing] = useState(false)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0])
  const [rangeDays, setRangeDays] = useState(DEFAULT_RANGE_DAYS)

  useEffect(() => {
    setPage(0)
  }, [pageSize, rangeDays])

  const granularity = rangeDays === 0 ? 'hour' : 'day'
  const rpcRangeDays = rangeDays === 0 ? 7 : rangeDays

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['usage', rangeDays, page, pageSize],
    queryFn: () => fetchUsageLogsPage(page, pageSize, rangeDays),
  })

  const { data: summaryData, isLoading: summaryLoading, isError: summaryError, error: summaryErrorObj, refetch: refetchSummary } = useQuery({
    queryKey: ['usageSummary', rangeDays, granularity],
    queryFn: () => fetchUsageSummary(rpcRangeDays, granularity),
  })

  const logs = data?.rows ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const isFirstPage = page === 0
  const isLastPage = page >= totalPages - 1

  const summary = summaryData ?? null

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([refetch(), refetchSummary()])
    setRefreshing(false)
  }, [refetch, refetchSummary])

  const formatNumber = (n: number): string => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
    return n.toLocaleString()
  }

  const formatRate = (rate: number | null): string => {
    if (rate === null || rate === undefined) return '—'
    return `${rate.toFixed(2)}%`
  }

  const formatLatency = (ms: number | null): string => {
    if (ms === null || ms === undefined) return '—'
    return `${Math.round(ms)}ms`
  }

  const getErrorRateStatus = (rate: number | null): 'good' | 'warning' | 'bad' | 'neutral' => {
    if (rate === null || rate === undefined) return 'neutral'
    if (rate < 2) return 'good'
    if (rate <= 10) return 'warning'
    return 'bad'
  }

  const getLatencyStatus = (ms: number | null): 'good' | 'warning' | 'bad' | 'neutral' => {
    if (ms === null || ms === undefined) return 'neutral'
    if (ms < 2000) return 'good'
    if (ms <= 5000) return 'warning'
    return 'bad'
  }

  const renderStatCards = () => {
    if (summaryLoading) {
      return (
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="surface-card" style={{ padding: '16px 20px', minWidth: 140, flex: 1 }}>
              <div className="skeleton-bar" style={{ height: 10, width: '60%', marginBottom: 8 }} />
              <div className="skeleton-bar" style={{ height: 28, width: '70%', marginBottom: 10 }} />
              <div className="skeleton-bar" style={{ height: 28, width: '100%' }} />
            </div>
          ))}
        </div>
      )
    }

    if (summaryError) {
      return (
        <div style={{ padding: '16px 20px', background: 'rgba(248,81,73,0.1)', border: '1px solid rgba(248,81,73,0.3)', borderRadius: 'var(--radius-md)', color: 'var(--color-red)', fontSize: 13, marginBottom: 24 }}>
          Failed to load usage summary: {(summaryErrorObj as Error).message}
          <button onClick={() => refetchSummary()} className="btn-primary" style={{ marginLeft: 12, fontSize: 12, padding: '6px 12px' }}>Retry</button>
        </div>
      )
    }

    if (!summary) return null

    const requestsTrend = summary.daily_series.map((d) => d.requests)
    const errorsTrend = summary.daily_series.map((d) => d.errors)

    return (
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <StatCard
          label="Total Requests"
          value={formatNumber(summary.total_requests)}
          trend={requestsTrend}
          status="neutral"
        />
        <StatCard
          label="Error Rate"
          value={formatRate(summary.error_rate)}
          trend={errorsTrend}
          status={getErrorRateStatus(summary.error_rate)}
        />
        <StatCard
          label="Avg Latency"
          value={formatLatency(summary.avg_latency_ms)}
          trend={[]}
          status={getLatencyStatus(summary.avg_latency_ms)}
        />
        <StatCard
          label="Total Errors"
          value={formatNumber(summary.total_errors)}
          trend={errorsTrend}
          status={summary.total_errors === 0 ? 'good' : summary.total_errors < 10 ? 'warning' : 'bad'}
        />
      </div>
    )
  }

  const formatBucketLabel = (bucket: string, granularity: 'day' | 'hour'): string => {
    const date = new Date(bucket)
    if (granularity === 'hour') {
      return date.toLocaleTimeString(undefined, { hour: 'numeric', hour12: true })
    }
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }

  const renderTrendChart = () => {
    if (summaryLoading || summaryError || !summary) return null

    const chartData = summary.daily_series.map((d) => ({
      label: formatBucketLabel(d.day, granularity),
      values: {
        Requests: d.requests,
        Errors: d.errors,
      },
    }))

    if (!chartData.length || chartData.every((d) => d.values.Requests === 0 && d.values.Errors === 0)) {
      return (
        <div className="surface-card" style={{ padding: '24px', marginBottom: 24, textAlign: 'center' }}>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>No usage data in this range to chart.</p>
        </div>
      )
    }

    const seriesKeys = ['Requests', 'Errors']
    const colors = ['var(--color-indigo)', 'var(--color-red)']

    return (
      <div className="surface-card" style={{ padding: '20px', marginBottom: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 16 }}>
          {granularity === 'hour' ? 'Hourly Trend (Today)' : `Daily Trend (Last ${rpcRangeDays} Days)`}
        </h3>
        <BarChart
          data={chartData}
          height={200}
          colors={colors}
          seriesKeys={seriesKeys}
          formatValue={(v) => Math.round(v).toLocaleString()}
        />
        <Legend series={seriesKeys} colors={colors} />
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, marginBottom: 4 }}>Usage</h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>
            Per-request logs from your <code>usage_logs</code> table.
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

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {['All providers', `Last ${rangeDays === 0 ? 'Today' : `${rangeDays} days`}`, 'All keys'].map((f) => (
          <button
            key={f}
            style={{
              padding: '7px 16px',
              borderRadius: 20,
              border: '1px solid var(--color-border)',
              background: f.startsWith('Last') || f === 'Today' ? 'var(--color-surface-2)' : 'transparent',
              color: (f.startsWith('Last') || f === 'Today') ? 'var(--color-text-primary)' : 'var(--color-text-faint)',
              fontSize: 13,
              cursor: 'not-allowed',
              fontFamily: 'var(--font-body)',
              opacity: (f.startsWith('Last') || f === 'Today') ? 1 : 0.6,
            }}
            disabled
          >
            {f}
          </button>
        ))}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--color-text-faint)' }}>Rows per page</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            disabled={isLoading}
            style={{
              padding: '6px 10px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface-2)',
              color: 'var(--color-text-primary)',
              fontSize: 13,
              fontFamily: 'var(--font-body)',
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
          <select
            value={rangeDays}
            onChange={(e) => setRangeDays(Number(e.target.value))}
            disabled={isLoading || summaryLoading}
            style={{
              marginLeft: 12,
              padding: '6px 10px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface-2)',
              color: 'var(--color-text-primary)',
              fontSize: 13,
              fontFamily: 'var(--font-body)',
              cursor: isLoading || summaryLoading ? 'not-allowed' : 'pointer',
            }}
          >
            <option value={0}>Today</option>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
      </div>

      {renderStatCards()}
      {renderTrendChart()}

      {/* Log table */}
      <div className="surface-card" style={{ overflow: 'hidden' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '160px 120px 1fr 80px 80px 70px',
            gap: 12,
            padding: '12px 20px',
            borderBottom: '1px solid var(--color-border-muted)',
            background: 'var(--color-surface-2)',
          }}
        >
          {['Time', 'Key label', 'Model', 'Tokens in', 'Tokens out', 'Status'].map((col) => (
            <span
              key={col}
              style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-faint)', textTransform: 'uppercase', letterSpacing: '0.07em' }}
            >
              {col}
            </span>
          ))}
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
        ) : !isLoading && logs.length > 0 ? (
          logs.map((row) => (
            <div
              key={row.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '160px 120px 1fr 80px 80px 70px',
                gap: 12,
                padding: '12px 20px',
                borderBottom: '1px solid var(--color-border-muted)',
                fontSize: 13,
                alignItems: 'center',
              }}
            >
              <span style={{ color: 'var(--color-text-faint)' }}>{new Date(row.created_at).toLocaleString()}</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-indigo)', fontWeight: 600 }}>{row.label_used ?? '—'}</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>{row.model}</span>
              <span style={{ color: row.tokens_estimated ? 'var(--color-text-faint)' : 'var(--color-text-muted)', fontStyle: row.tokens_estimated ? 'italic' : 'normal' }} title={row.tokens_estimated ? 'Estimated — provider did not report real usage' : undefined}>
                {row.prompt_tokens != null ? (row.tokens_estimated ? `~${row.prompt_tokens}` : row.prompt_tokens) : '—'}
              </span>
              <span style={{ color: row.tokens_estimated ? 'var(--color-text-faint)' : 'var(--color-text-muted)', fontStyle: row.tokens_estimated ? 'italic' : 'normal' }} title={row.tokens_estimated ? 'Estimated — provider did not report real usage' : undefined}>
                {row.completion_tokens != null ? (row.tokens_estimated ? `~${row.completion_tokens}` : row.completion_tokens) : '—'}
              </span>
              <span style={{ color: row.status_code >= 200 && row.status_code < 300 ? 'var(--color-green)' : 'var(--color-red)', fontWeight: 600 }}>
                {row.status_code}
              </span>
            </div>
          ))
        ) : !isLoading ? (
          <EmptyState
            icon={
              <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="1,12 5,7 8,10 11,5 15,3" />
              </svg>
            }
            title="No usage logged"
            description="Usage logs appear here after your first routed request. Each row maps to one entry in the usage_logs table."
          />
        ) : (
          Array.from({ length: Math.min(pageSize, 8) }, (_, i) => i).map((i) => (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '160px 120px 1fr 80px 80px 70px',
                gap: 12,
                padding: '12px 20px',
                borderBottom: '1px solid var(--color-border-muted)',
                alignItems: 'center',
              }}
            >
              <span className="skeleton-bar" style={{ height: 12, width: '75%' }} />
              <span className="skeleton-bar" style={{ height: 12, width: '60%' }} />
              <span className="skeleton-bar" style={{ height: 12, width: '85%' }} />
              <span className="skeleton-bar" style={{ height: 12, width: '50%' }} />
              <span className="skeleton-bar" style={{ height: 12, width: '50%' }} />
              <span className="skeleton-bar" style={{ height: 12, width: '40%' }} />
            </div>
          ))
        )}

        {!isLoading && !isError && total > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 20px',
              borderTop: '1px solid var(--color-border-muted)',
              background: 'var(--color-surface-2)',
            }}
          >
            <span style={{ fontSize: 12, color: 'var(--color-text-faint)' }}>
              {total === 0 ? '0 rows' : (
                <>
                  Showing <strong style={{ color: 'var(--color-text-muted)' }}>{page * pageSize + 1}–{Math.min((page + 1) * pageSize, total)}</strong> of <strong style={{ color: 'var(--color-text-muted)' }}>{total.toLocaleString()}</strong>
                </>
              )}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={isFirstPage}
                aria-label="Previous page"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 30,
                  height: 30,
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  color: isFirstPage ? 'var(--color-text-faint)' : 'var(--color-text-primary)',
                  cursor: isFirstPage ? 'not-allowed' : 'pointer',
                  opacity: isFirstPage ? 0.5 : 1,
                }}
              >
                <IconChevronLeft />
              </button>
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', minWidth: 70, textAlign: 'center' }}>
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={isLastPage}
                aria-label="Next page"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 30,
                  height: 30,
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  color: isLastPage ? 'var(--color-text-faint)' : 'var(--color-text-primary)',
                  cursor: isLastPage ? 'not-allowed' : 'pointer',
                  opacity: isLastPage ? 0.5 : 1,
                }}
              >
                <IconChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>

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
        Reads from: <span style={{ color: 'var(--color-text-muted)' }}>usage_logs</span> ·
        Fields: <span style={{ color: 'var(--color-text-muted)' }}>label_used, provider, model, prompt_tokens, completion_tokens, tokens_estimated, status_code, latency_ms, created_at</span>
      </div>
    </div>
  )
}