import { useEffect, useRef, useState } from 'react'

interface SparklineProps {
  data: number[]
  height?: number
  color?: string
}

const DEFAULT_HEIGHT = 32
const DEFAULT_COLOR = 'var(--color-indigo)'
const PADDING = { top: 4, right: 4, bottom: 4, left: 4 }

export function Sparkline({ data, height = DEFAULT_HEIGHT, color = DEFAULT_COLOR }: SparklineProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [measuredWidth, setMeasuredWidth] = useState(200)

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
  const innerWidth = W - PADDING.left - PADDING.right
  const innerHeight = height - PADDING.top - PADDING.bottom

  if (!data.length) {
    return (
      <div ref={containerRef} style={{ width: '100%' }}>
        <svg
          width="100%"
          height={height}
          viewBox={`0 0 ${W} ${height}`}
          aria-hidden="true"
          role="img"
        />
      </div>
    )
  }

  const minValue = Math.min(...data)
  const maxValue = Math.max(...data)
  const valueRange = maxValue - minValue || 1

  const xScale = (index: number) =>
    PADDING.left + (index / Math.max(1, data.length - 1)) * innerWidth

  const yScale = (value: number) =>
    PADDING.top + innerHeight - ((value - minValue) / valueRange) * innerHeight

  const points = data.map((value, i) => `${xScale(i)},${yScale(value)}`).join(' ')

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${W} ${height}`}
        aria-hidden="true"
        role="img"
        style={{ display: 'block', overflow: 'visible' }}
      >
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  )
}