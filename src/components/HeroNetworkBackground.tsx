import { useEffect, useRef } from 'react'

/**
 * HeroRoutingTopology — Deliberate SVG routing-map graphic.
 *
 * Shows provider nodes arranged in a fixed layout converging on a central
 * Keyroute hub, with animated signal packets traveling along bezier paths.
 * Colors use CSS custom properties so it adapts to dark/light theme.
 *
 * Fully accessible: aria-hidden, prefers-reduced-motion respected.
 *
 * DESIGN CLEANUP: No glow filters, no gradients. Subtle, clean lines.
 *
 * UPDATE (full-bleed): previously confined to the right 55% of the hero,
 * which put it almost entirely behind HeroRouteDemo's solid blurred card —
 * so the left column (headline + copy) had nothing behind it and read as
 * empty. Nodes are now spread across the full hero width, with the hub
 * pulled toward the demo card's position so the convergence point still
 * makes visual sense next to it. Opacity trimmed slightly since the
 * graphic now sits behind text on the left, not just open space.
 */

interface ProviderNode {
  id: string
  label: string
  x: number
  y: number
  color: string
  size?: number
}

interface RouteEdge {
  from: string
  to: string
  cp1x: number
  cp1y: number
  cp2x: number
  cp2y: number
  packetDelay: number
  packetDuration: number
}

const PROVIDERS: ProviderNode[] = [
  { id: 'hub', label: 'Keyroute', x: 64, y: 58, color: 'var(--color-indigo)', size: 8 },
  { id: 'openai', label: 'OpenAI', x: 6, y: 15, color: 'var(--color-text-muted)', size: 5 },
  { id: 'gemini', label: 'Gemini', x: 40, y: 6, color: 'var(--color-text-muted)', size: 5 },
  { id: 'groq', label: 'Groq', x: 93, y: 18, color: 'var(--color-text-muted)', size: 5 },
  { id: 'anthropic', label: 'Anthropic', x: 88, y: 90, color: 'var(--color-text-muted)', size: 5 },
  { id: 'custom', label: 'Custom', x: 13, y: 84, color: 'var(--color-text-muted)', size: 5 },
]

const EDGES: RouteEdge[] = [
  { from: 'openai', to: 'hub', cp1x: 20, cp1y: 20, cp2x: 42, cp2y: 40, packetDelay: 0, packetDuration: 3.4 },
  { from: 'gemini', to: 'hub', cp1x: 46, cp1y: 14, cp2x: 56, cp2y: 34, packetDelay: 0.9, packetDuration: 2.9 },
  { from: 'groq', to: 'hub', cp1x: 86, cp1y: 26, cp2x: 74, cp2y: 40, packetDelay: 1.7, packetDuration: 3.3 },
  { from: 'anthropic', to: 'hub', cp1x: 80, cp1y: 86, cp2x: 71, cp2y: 70, packetDelay: 0.4, packetDuration: 2.7 },
  { from: 'custom', to: 'hub', cp1x: 24, cp1y: 80, cp2x: 44, cp2y: 66, packetDelay: 2.1, packetDuration: 3.1 },
]

function px(percent: number, total: number) {
  return (percent / 100) * total
}

export function HeroNetworkBackground() {
  const svgRef = useRef<SVGSVGElement>(null)
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Listen for theme changes and update SVG colors
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    const updateColors = () => {
      const isLight = document.documentElement.getAttribute('data-theme') === 'light'
      svg.setAttribute('data-theme-variant', isLight ? 'light' : 'dark')
    }

    updateColors()
    const observer = new MutationObserver(updateColors)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  const W = 1200
  const H = 620

  const getNode = (id: string) => PROVIDERS.find(n => n.id === id)!

  return (
    <svg
      ref={svgRef}
      aria-hidden="true"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.12,
      }}
    >
      {/* Path defs for animateMotion */}
      <defs>
        {EDGES.map(edge => {
          const from = getNode(edge.from)
          const to = getNode(edge.to)
          const x1 = px(from.x, W), y1 = px(from.y, H)
          const x2 = px(to.x, W), y2 = px(to.y, H)
          const cp1x = px(edge.cp1x, W), cp1y = px(edge.cp1y, H)
          const cp2x = px(edge.cp2x, W), cp2y = px(edge.cp2y, H)
          return (
            <path
              key={`path-def-${edge.from}`}
              id={`route-${edge.from}`}
              d={`M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`}
            />
          )
        })}
      </defs>

      {/* ── Route paths (thin, subtle) ── */}
      {EDGES.map(edge => {
        const from = getNode(edge.from)
        const to = getNode(edge.to)
        const x1 = px(from.x, W), y1 = px(from.y, H)
        const x2 = px(to.x, W), y2 = px(to.y, H)
        const cp1x = px(edge.cp1x, W), cp1y = px(edge.cp1y, H)
        const cp2x = px(edge.cp2x, W), cp2y = px(edge.cp2y, H)
        return (
          <path
            key={`line-${edge.from}`}
            d={`M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`}
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
            style={{ color: 'var(--color-border)', opacity: 0.6 }}
          />
        )
      })}

      {/* ── Animated signal packets ── */}
      {!prefersReducedMotion && EDGES.map(edge => {
        return (
          <circle
            key={`packet-${edge.from}`}
            r="2.5"
            fill="var(--color-indigo)"
            style={{ opacity: 0.8 }}
          >
            <animateMotion
              dur={`${edge.packetDuration}s`}
              begin={`${edge.packetDelay}s`}
              repeatCount="indefinite"
            >
              <mpath href={`#route-${edge.from}`} />
            </animateMotion>
          </circle>
        )
      })}

      {/* ── Provider nodes ── */}
      {PROVIDERS.filter(n => n.id !== 'hub').map(node => {
        const x = px(node.x, W)
        const y = px(node.y, H)
        const r = node.size ?? 5
        return (
          <g key={node.id}>
            {/* Outer ring */}
            <circle
              cx={x} cy={y} r={r + 4}
              fill="none"
              stroke="var(--color-border)"
              strokeWidth="1"
              opacity="0.2"
            />
            {/* Node dot */}
            <circle
              cx={x} cy={y} r={r}
              fill="var(--color-text-muted)"
              opacity="0.7"
            />
          </g>
        )
      })}

      {/* ── Central hub (Keyroute) ── */}
      {(() => {
        const hub = getNode('hub')
        const x = px(hub.x, W)
        const y = px(hub.y, H)
        return (
          <g>
            {/* Hub core */}
            <circle cx={x} cy={y} r={hub.size!} fill="var(--color-indigo)" opacity="0.9" />
            {/* Hub label */}
            <text
              x={x}
              y={y + 26}
              fontSize="10"
              fontFamily="'JetBrains Mono', ui-monospace, monospace"
              fontWeight="600"
              fill="var(--color-indigo)"
              textAnchor="middle"
              opacity="0.6"
            >
              keyroute
            </text>
          </g>
        )
      })()}
    </svg>
  )
}
