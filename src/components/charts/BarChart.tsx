import { useEffect, useRef, useState } from 'react'

interface BarDataPoint {
  label: string
  value: number
}

interface StackedBarDataPoint {
  label: string
  values: Record<string, number>
}

type ChartData = BarDataPoint[] | StackedBarDataPoint[]

interface BarChartProps {
  data: ChartData
  height?: number
  colors?: string[]
  maxValue?: number
  showZeroLine?: boolean
  /**
   * Explicit series order for stacked charts. Pass the SAME array you use
   * to build the Legend, so bar colors and legend colors can never disagree.
   * If omitted, falls back to the union of keys across ALL data points
   * (not just the first one — a stacked bar chart where different days
   * have different keys present, e.g. an "Other" bucket that only shows
   * up on some days, would otherwise silently drop series that aren't
   * in data[0]).
   */
  seriesKeys?: string[]
  /**
   * How to format a raw number for display in the hover tooltip. Defaults
   * to a plain thousands-separated integer. Pass something like the
   * existing formatNumber() (1.2k / 3.4M style) from the calling page for
   * token counts, or leave default for plain counts like request totals.
   */
  formatValue?: (value: number) => string
}

const DEFAULT_COLORS = ['var(--color-indigo)', 'var(--color-amber)', 'var(--color-text-muted)']
const DEFAULT_HEIGHT = 200
const PADDING = { top: 16, right: 12, bottom: 44, left: 44 }
const BAR_GAP_RATIO = 0.2
const MIN_BAR_WIDTH = 8
// Minimum horizontal pixels between the centers of two consecutive x-axis
// labels before one gets skipped. Tuned for a ~5-6 character date/time
// label (e.g. "Aug 19", "2 PM") at 10px monospace — tight enough that a
// 7-bar week still shows every label, loose enough that 90 bars don't smear.
const MIN_LABEL_SPACING = 42

function defaultFormatValue(v: number): string {
  return Math.round(v).toLocaleString()
}

function isStackedData(data: ChartData): data is StackedBarDataPoint[] {
  return data.length > 0 && 'values' in data[0]
}

function getMaxValue(data: ChartData): number {
  if (isStackedData(data)) {
    return Math.max(
      ...data.map(d => Object.values(d.values).reduce((a, b) => a + b, 0))
    )
  }
  return Math.max(...data.map(d => d.value))
}

function getSeriesKeys(data: ChartData, explicit?: string[]): string[] {
  if (explicit) return explicit
  if (!isStackedData(data) || data.length === 0) return []
  const keys = new Set<string>()
  for (const point of data) {
    Object.keys(point.values).forEach(k => keys.add(k))
  }
  return Array.from(keys)
}

export function BarChart({
  data,
  height = DEFAULT_HEIGHT,
  colors = DEFAULT_COLORS,
  maxValue,
  showZeroLine = true,
  seriesKeys: seriesKeysProp,
  formatValue = defaultFormatValue,
}: BarChartProps) {
  // Measure the real container width instead of trusting a fixed viewBox.
  // Using ResizeObserver so bars genuinely fill the card at any width,
  // and x-axis text doesn't get horizontally stretched or squashed.
  const containerRef = useRef<HTMLDivElement>(null)
  const [measuredWidth, setMeasuredWidth] = useState(600)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect.width
      if (w && w > 0) setMeasuredWidth(w)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const W = measuredWidth

  if (!data.length) {
    return (
      <div ref={containerRef} style={{ width: '100%' }}>
        <svg
          width="100%"
          height={height}
          viewBox={`0 0 ${W} ${height}`}
          aria-hidden="true"
          role="img"
        >
          <text
            x={W / 2}
            y={height / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="13"
            fontFamily="var(--font-body)"
            fill="var(--color-text-faint)"
          >
            No data
          </text>
        </svg>
      </div>
    )
  }

  const isStacked = isStackedData(data)
  const seriesKeys = getSeriesKeys(data, seriesKeysProp)
  const dataMax = getMaxValue(data)
  const scaleMax = maxValue ?? Math.max(dataMax, 1)
  const innerWidth = W - PADDING.left - PADDING.right
  const innerHeight = height - PADDING.top - PADDING.bottom
  const barCount = data.length
  const barAndGapWidth = innerWidth / barCount
  const gap = barAndGapWidth * BAR_GAP_RATIO
  const barWidth = Math.max(MIN_BAR_WIDTH, barAndGapWidth - gap)

  const xScale = (index: number) =>
    PADDING.left + index * barAndGapWidth + gap / 2

  const bottomY = PADDING.top + innerHeight

  // Precompute each bar's total rendered top-Y (needed both for drawing
  // stacked segments correctly and for anchoring the tooltip above the
  // right spot) in one pass, so rendering and tooltip positioning agree.
  const pointTopY = data.map(point => {
    if (!isStacked) {
      const v = (point as BarDataPoint).value
      if (v <= 0) return bottomY
      const h = Math.max(1, innerHeight * (v / scaleMax))
      return bottomY - h
    }
    const stackedPoint = point as StackedBarDataPoint
    let total = 0
    for (const key of seriesKeys) {
      const v = stackedPoint.values[key] ?? 0
      if (v <= 0) continue
      total += Math.max(1, innerHeight * (v / scaleMax))
    }
    return bottomY - total
  })

  const hovered = hoveredIndex !== null ? data[hoveredIndex] : null

  return (
    <div ref={containerRef} style={{ width: '100%', position: 'relative' }}>
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${W} ${height}`}
        aria-hidden="true"
        role="img"
        style={{ display: 'block', overflow: 'visible' }}
      >
      {/* Zero baseline */}
      {showZeroLine && (
        <line
          x1={PADDING.left}
          y1={bottomY}
          x2={PADDING.left + innerWidth}
          y2={bottomY}
          stroke="var(--color-border-muted)"
          strokeWidth="1"
        />
      )}

      {/* Hover highlight — sits behind the bars, only visible for the
          currently-hovered slot */}
      {hoveredIndex !== null && (
        <rect
          x={PADDING.left + hoveredIndex * barAndGapWidth}
          y={PADDING.top}
          width={barAndGapWidth}
          height={innerHeight}
          fill="var(--color-surface-2)"
          opacity={0.5}
        />
      )}

      {/* Y-axis grid lines (subtle) — rendered BEFORE the bars so bars paint
          on top of the grid, not the other way around. Previously this block
          sat after the bars in paint order, which put dotted grid lines
          visibly cutting through solid bar fills. */}
      {[0.25, 0.5, 0.75].map(frac => (
        <line
          key={frac}
          x1={PADDING.left}
          y1={PADDING.top + innerHeight * frac}
          x2={PADDING.left + innerWidth}
          y2={PADDING.top + innerHeight * frac}
          stroke="var(--color-border-muted)"
          strokeWidth="0.5"
          strokeDasharray="2,4"
        />
      ))}

      {/* Bars */}
      {data.map((point, i) => {
        const x = xScale(i)

        if (!isStacked) {
          const barPoint = point as BarDataPoint
          if (barPoint.value <= 0) return null
          const barHeight = innerHeight * (barPoint.value / scaleMax)
          return (
            <rect
              key={barPoint.label + i}
              x={x}
              y={bottomY - barHeight}
              width={barWidth}
              height={Math.max(1, barHeight)}
              fill="var(--color-indigo)"
              rx={2}
              opacity={hoveredIndex === null || hoveredIndex === i ? 1 : 0.55}
              style={{ transition: 'opacity 0.12s ease' }}
            />
          )
        }

        let yOffset = 0
        const stackedPoint = point as StackedBarDataPoint
        return (
          <g key={stackedPoint.label + i}>
            {seriesKeys.map((seriesKey, seriesIndex) => {
              const value = stackedPoint.values[seriesKey] ?? 0
              if (value <= 0) return null
              const barHeight = innerHeight * (value / scaleMax)
              // Render height is floored to 1px so tiny-but-real values
              // stay visible. Stack offset MUST use this same rendered
              // height (not the raw pre-floor value) or the next segment
              // in the stack ends up positioned as if the previous one
              // rendered at ~0px, overlapping it instead of sitting on
              // top of it.
              const renderHeight = Math.max(1, barHeight)
              const y = bottomY - yOffset - renderHeight
              yOffset += renderHeight
              return (
                <rect
                  key={seriesKey}
                  x={x}
                  y={y}
                  width={barWidth}
                  height={renderHeight}
                  fill={colors[seriesIndex % colors.length]}
                  rx={seriesIndex === 0 ? 2 : 0}
                  opacity={hoveredIndex === null || hoveredIndex === i ? 1 : 0.55}
                  style={{ transition: 'opacity 0.12s ease' }}
                />
              )
            })}
          </g>
        )
      })}

      {/* X-axis labels — thinned AND angled on dense charts, the same
          approach usage-graph dashboards (Stripe, Vercel, GitHub) use: past
          a density threshold, tilt the remaining labels ~40° so more of
          them stay legible in the same width instead of just deleting most
          of them. Below the threshold (roughly ≤10-12 bars, e.g. a 7-day
          view) labels stay flat and every single one shows, since there's
          room for that already.
          The previous version of this fix always force-showed the LAST
          bar's label regardless of spacing, which could land it directly
          on top of the nearest regularly-thinned label (the "Aug 17 Aug 19"
          collision). Now the last label REPLACES the nearest previous one
          if they'd be too close, instead of both rendering. */}
      {(() => {
        const skip = Math.max(1, Math.ceil(MIN_LABEL_SPACING / barAndGapWidth))
        const isDense = skip > 1
        const indices: number[] = []
        for (let i = 0; i < data.length; i += skip) indices.push(i)
        const lastIdx = data.length - 1
        if (indices[indices.length - 1] !== lastIdx) {
          const prevShown = indices[indices.length - 1]
          const gapPx = (lastIdx - prevShown) * barAndGapWidth
          if (gapPx < MIN_LABEL_SPACING) {
            indices[indices.length - 1] = lastIdx
          } else {
            indices.push(lastIdx)
          }
        }
        return indices.map(i => {
          const point = data[i]
          const labelX = xScale(i) + barWidth / 2
          const labelY = bottomY + (isDense ? 14 : 18)
          return (
            <text
              key={point.label + i}
              x={labelX}
              y={labelY}
              textAnchor={isDense ? 'end' : 'middle'}
              fontSize="10"
              fontFamily="var(--font-mono)"
              fill="var(--color-text-muted)"
              transform={isDense ? `rotate(-40 ${labelX} ${labelY})` : undefined}
            >
              {point.label}
            </text>
          )
        })
      })()}

      {/* Invisible hover targets — one per data point, spanning the full
          column height. Rendered LAST (on top) so they always receive the
          mouse event even where a bar is short or absent (zero value). */}
      {data.map((point, i) => (
        <rect
          key={`hit-${point.label}-${i}`}
          x={PADDING.left + i * barAndGapWidth}
          y={PADDING.top}
          width={barAndGapWidth}
          height={innerHeight}
          fill="transparent"
          onMouseEnter={() => setHoveredIndex(i)}
          onMouseLeave={() => setHoveredIndex(null)}
          style={{ cursor: 'pointer' }}
        />
      ))}
      </svg>

      {/* Tooltip — HTML overlay, not SVG, so it can use normal box-shadow/
          border-radius and never gets clipped by the SVG viewport. Anchored
          to the hovered bar's actual top position (computed above), not to
          live mouse coordinates — steadier to read than a tooltip that
          jitters as the cursor moves within a tall hit target. */}
      {hoveredIndex !== null && hovered && (
        <div
          style={{
            position: 'absolute',
            left: Math.min(
              Math.max(xScale(hoveredIndex) + barWidth / 2, 55),
              W - 55
            ),
            top: pointTopY[hoveredIndex],
            transform: 'translate(-50%, calc(-100% - 10px))',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-card)',
            padding: '8px 12px',
            fontSize: 12,
            fontFamily: 'var(--font-body)',
            color: 'var(--color-text-primary)',
            pointerEvents: 'none',
            zIndex: 10,
            whiteSpace: 'nowrap',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: isStacked ? 6 : 2 }}>
            {hovered.label || '—'}
          </div>
          {isStacked ? (
            (seriesKeys.length ? seriesKeys : Object.keys((hovered as StackedBarDataPoint).values)).map((key, si) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: colors[si % colors.length], flexShrink: 0 }} />
                <span style={{ color: 'var(--color-text-muted)' }}>{key}</span>
                <span style={{ fontWeight: 600, marginLeft: 'auto', paddingLeft: 12 }}>
                  {formatValue((hovered as StackedBarDataPoint).values[key] ?? 0)}
                </span>
              </div>
            ))
          ) : (
            <div style={{ fontSize: 15, fontWeight: 700 }}>
              {formatValue((hovered as BarDataPoint).value)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface LegendProps {
  series: string[]
  colors: string[]
}

export function Legend({ series, colors = DEFAULT_COLORS }: LegendProps) {
  if (!series.length) return null

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px 20px',
        marginTop: 12,
        fontSize: 12,
        fontFamily: 'var(--font-body)',
        color: 'var(--color-text-muted)',
      }}
      aria-label="Chart legend"
    >
      {series.map((name, i) => (
        <span
          key={name}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              background: colors[i % colors.length],
              flexShrink: 0,
            }}
            aria-hidden="true"
          />
          {name}
        </span>
      ))}
    </div>
  )
}
