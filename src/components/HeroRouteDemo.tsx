/**
 * HeroRouteDemo — The signature animated component.
 * Demonstrates the gateway routing mechanism: prefix/model → resolved key label.
 *
 * COLOR RULE: this component uses ONLY --color-amber and --color-indigo as
 * accents, per design-system/keyroute/MASTER.md. Provider brand colors
 * (OpenAI green, Groq red, Gemini blue) are explicitly forbidden here —
 * they were removed because they broke the site's color discipline.
 *
 * DESIGN CLEANUP: No gradients, no glows, no neon effects. Only the
 * "routed via Keyroute" connector uses indigo as the signature accent.
 */
import { useEffect, useReducer, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'

interface Example {
  input: string
  prefix: string
  model: string
  provider: string
  label: string
  maskedKey: string
  endpoint: string
}

const EXAMPLES: Example[] = [
  {
    input: 'openai-work/gpt-4o',
    prefix: 'openai-work',
    model: 'gpt-4o',
    provider: 'OpenAI',
    label: 'openai-work',
    maskedKey: 'sk-••••••••••••••3f2a',
    endpoint: 'api.openai.com',
  },
  {
    input: 'groq-fast/llama-3.3-70b',
    prefix: 'groq-fast',
    model: 'llama-3.3-70b',
    provider: 'Groq',
    label: 'groq-fast',
    maskedKey: 'gsk_••••••••••••••9c1d',
    endpoint: 'api.groq.com',
  },
  {
    input: 'gemini-pro/gemini-1.5-flash',
    prefix: 'gemini-pro',
    model: 'gemini-1.5-flash',
    provider: 'Google Gemini',
    label: 'gemini-pro',
    maskedKey: 'AIza••••••••••••••k8mR',
    endpoint: 'generativelanguage.googleapis.com',
  },
]

const T_TYPE_CHAR = 45
const T_PAUSE_AFTER_TYPE = 600
const T_RESOLVE_DURATION = 800
const T_SHOW_CARD_DELAY = 400
const T_NEXT_EXAMPLE = 3200

type Stage = 'typing' | 'resolving' | 'resolved' | 'confirmed'

interface State {
  exampleIndex: number
  stage: Stage
  typedChars: number
}

type Action =
  | { type: 'TYPE_CHAR' }
  | { type: 'START_RESOLVE' }
  | { type: 'SHOW_RESOLVED' }
  | { type: 'CONFIRM' }
  | { type: 'NEXT_EXAMPLE' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'TYPE_CHAR':
      return { ...state, typedChars: state.typedChars + 1 }
    case 'START_RESOLVE':
      return { ...state, stage: 'resolving' }
    case 'SHOW_RESOLVED':
      return { ...state, stage: 'resolved' }
    case 'CONFIRM':
      return { ...state, stage: 'confirmed' }
    case 'NEXT_EXAMPLE':
      return {
        exampleIndex: (state.exampleIndex + 1) % EXAMPLES.length,
        stage: 'typing',
        typedChars: 0,
      }
    default:
      return state
  }
}

export function HeroRouteDemo() {
  const prefersReduced = useReducedMotion()
  const [state, dispatch] = useReducer(reducer, {
    exampleIndex: 0,
    stage: prefersReduced ? 'confirmed' : 'typing',
    typedChars: prefersReduced ? 999 : 0,
  })
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const ex = EXAMPLES[state.exampleIndex]
  const displayedText = ex.input.slice(0, state.typedChars)
  const isFullyTyped = state.typedChars >= ex.input.length

  useEffect(() => {
    return () => { timersRef.current.forEach(clearTimeout) }
  }, [])

  useEffect(() => {
    if (prefersReduced) return

    timersRef.current.forEach(clearTimeout)
    timersRef.current = []

    if (state.stage === 'typing') {
      if (!isFullyTyped) {
        const t = setTimeout(() => dispatch({ type: 'TYPE_CHAR' }), T_TYPE_CHAR)
        timersRef.current.push(t)
      } else {
        const t = setTimeout(() => dispatch({ type: 'START_RESOLVE' }), T_PAUSE_AFTER_TYPE)
        timersRef.current.push(t)
      }
    }

    if (state.stage === 'resolving') {
      const t1 = setTimeout(() => dispatch({ type: 'SHOW_RESOLVED' }), T_RESOLVE_DURATION)
      const t2 = setTimeout(() => dispatch({ type: 'CONFIRM' }), T_RESOLVE_DURATION + T_SHOW_CARD_DELAY + 600)
      const t3 = setTimeout(() => dispatch({ type: 'NEXT_EXAMPLE' }), T_RESOLVE_DURATION + T_NEXT_EXAMPLE)
      timersRef.current.push(t1, t2, t3)
    }
  }, [state.stage, state.typedChars, isFullyTyped, prefersReduced])

  const showResolved = state.stage === 'resolved' || state.stage === 'confirmed' || prefersReduced

  const slashIdx = displayedText.indexOf('/')
  const hasSlash = slashIdx !== -1
  const displayPrefix = hasSlash ? displayedText.slice(0, slashIdx) : displayedText
  const displayModel = hasSlash ? displayedText.slice(slashIdx) : ''

  return (
    <div
      style={{
        background: 'color-mix(in srgb, var(--color-surface) 80%, transparent)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-xl)',
        padding: 28,
        width: '100%',
        maxWidth: 520,
        margin: '0 auto',
        boxShadow: 'var(--shadow-card)',
      }}
      role="img"
      aria-label="Gateway routing demonstration"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--color-border)' }} />
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--color-border)' }} />
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--color-border)' }} />
        <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--color-text-faint)', fontFamily: 'var(--font-mono)' }}>
          POST /v1/chat/completions
        </span>
      </div>

      <div
        style={{
          background: 'var(--color-surface-2)',
          borderRadius: 'var(--radius-md)',
          padding: '14px 16px',
          marginBottom: 20,
          border: '1px solid var(--color-border-muted)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <p style={{ fontSize: 11, color: 'var(--color-text-faint)', marginBottom: 6, fontFamily: 'var(--font-mono)' }}>
          model
        </p>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 600, display: 'flex', alignItems: 'center' }}>
          <span
            style={{
              color: showResolved ? 'var(--color-indigo)' : 'var(--color-text-primary)',
              background: showResolved ? 'rgba(124, 143, 245, 0.1)' : 'transparent',
              borderRadius: 4,
              padding: '0 2px',
              transition: 'color 0.3s ease, background 0.3s ease',
            }}
          >
            {displayPrefix}
          </span>
          {displayModel && (
            <span style={{ color: 'var(--color-text-muted)' }}>{displayModel}</span>
          )}
          {!isFullyTyped && state.stage === 'typing' && (
            <span
              style={{
                display: 'inline-block',
                width: 2,
                height: '1.1em',
                background: 'var(--color-indigo)',
                marginLeft: 2,
                verticalAlign: 'text-bottom',
                animation: 'blink 1s step-end infinite',
              }}
            />
          )}
        </div>

        {state.stage === 'resolving' && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              height: 2,
              background: 'var(--color-indigo)',
              animation: 'resolveBar 0.8s ease forwards',
            }}
          />
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0 0 20px', gap: 2 }}>
        <div
          style={{
            width: 1,
            height: 20,
            background: showResolved ? 'var(--color-indigo)' : 'var(--color-border)',
            transition: 'background 0.4s ease',
          }}
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '4px 12px',
            borderRadius: 20,
            background: showResolved ? 'rgba(124, 143, 245, 0.1)' : 'transparent',
            border: `1px solid ${showResolved ? 'var(--color-indigo)' : 'var(--color-border)'}`,
            transition: 'all 0.3s ease',
          }}
        >
          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: showResolved ? 'var(--color-indigo)' : 'var(--color-text-muted)' }}>
            {state.stage === 'typing' ? 'Keyroute Gateway' : state.stage === 'resolving' ? 'resolving…' : 'routed via Keyroute'}
          </span>
        </div>
        <div
          style={{
            width: 1,
            height: 20,
            background: showResolved ? 'var(--color-indigo)' : 'var(--color-border)',
            transition: 'background 0.4s ease',
          }}
        />
      </div>

      <div
        style={{
          background: showResolved ? 'var(--color-surface-2)' : 'rgba(0,0,0,0.2)',
          border: `1px solid ${showResolved ? 'var(--color-border)' : 'var(--color-border-muted)'}`,
          borderRadius: 'var(--radius-md)',
          padding: '14px 16px',
          opacity: showResolved ? 1 : 0.3,
          transform: showResolved ? 'translateY(0)' : 'translateY(4px)',
          transition: 'all 0.4s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--color-indigo)',
                transition: 'background 0.3s ease',
              }}
            />
            <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
              {ex.provider}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--color-text-faint)', fontFamily: 'var(--font-mono)' }}>label</span>
            <span style={{ fontSize: 13, color: 'var(--color-indigo)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              {showResolved ? ex.label : '···'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--color-text-faint)', fontFamily: 'var(--font-mono)' }}>key</span>
            <span style={{ fontSize: 13, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
              {showResolved ? ex.maskedKey : '···'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--color-text-faint)', fontFamily: 'var(--font-mono)' }}>endpoint</span>
            <span style={{ fontSize: 11, color: 'var(--color-indigo)', fontFamily: 'var(--font-mono)' }}>
              {showResolved ? ex.endpoint : '···'}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 20 }}>
        {EXAMPLES.map((_, i) => (
          <span
            key={i}
            style={{
              width: i === state.exampleIndex ? 20 : 6,
              height: 6,
              borderRadius: 3,
              background: i === state.exampleIndex ? 'var(--color-indigo)' : 'var(--color-border)',
              transition: 'all 0.3s ease',
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes resolveBar { from { width: 0%; } to { width: 100%; } }
        @media (prefers-reduced-motion: reduce) {
          @keyframes blink { from, to { opacity: 1; } }
          @keyframes resolveBar { from, to { width: 100%; } }
        }
      `}</style>
    </div>
  )
}