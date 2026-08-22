import { useState, useCallback } from 'react'

interface CodeBlockProps {
  code: string
  language?: string
  filename?: string
  showCopy?: boolean
}

type TokenType = 'comment' | 'string' | 'keyword' | 'function' | 'variable' | 'number' | 'text'

interface Token {
  type: TokenType
  text: string
}

// Single-pass tokenizer per language — never re-runs regex over already-wrapped HTML
function tokenize(code: string, lang: string): Token[] {
  const tokens: Token[] = []

  if (lang === 'bash' || lang === 'sh') {
    // Pattern order matters: match longer/more specific first
    const patterns: [RegExp, TokenType][] = [
      [/^(\s*)(#.*)$/, 'comment'],
      [/^(\s*)(export|unset|set|local|readonly)\b/, 'keyword'],
      [/^(\s*)(curl|python|node|npm|bash|sh|python3|pip)\b/, 'keyword'],
      [/(\$\w+)/, 'variable'],
      [/("(?:[^"\\]|\\.)*")/, 'string'],
      [/('(?:[^'\\]|\\.)*')/, 'string'],
      [/(\d+\.?\d*)/, 'number'],
      [/(\w+)(?=\()/g, 'function'],
      [/(\w+)/, 'text'],
    ]

    const lines = code.split('\n')
    lines.forEach((line, lineIdx) => {
      let remaining = line
      let leadingWhitespace = ''
      const wsMatch = line.match(/^(\s*)/)
      if (wsMatch) {
        leadingWhitespace = wsMatch[1]
        remaining = line.slice(leadingWhitespace.length)
      }

      if (leadingWhitespace) tokens.push({ type: 'text', text: leadingWhitespace })

      while (remaining.length > 0) {
        let matched = false
        for (const [regex, type] of patterns) {
          const match = remaining.match(regex)
          if (match && match.index === 0) {
            tokens.push({ type, text: match[0] })
            remaining = remaining.slice(match[0].length)
            matched = true
            break
          }
        }
        if (!matched) {
          tokens.push({ type: 'text', text: remaining[0] })
          remaining = remaining.slice(1)
        }
      }

      if (lineIdx < lines.length - 1) {
        tokens.push({ type: 'text', text: '\n' })
      }
    })

    return tokens
  }

  if (lang === 'python') {
    const patterns: [RegExp, TokenType][] = [
      [/^(\s*)(#.*)$/, 'comment'],
      [/(import|from|as|def|return|if|elif|else|for|in|while|True|False|None|and|or|not|with|try|except|finally|raise|class|lambda|yield|await|async|pass|break|continue|global|nonlocal|del|assert|is|match|case)\b/, 'keyword'],
      [/("(?:[^"\\]|\\.)*")/, 'string'],
      [/('(?:[^'\\]|\\.)*')/, 'string'],
      [/(\d+\.?\d*)/, 'number'],
      [/(\w+)(?=\()/g, 'function'],
      [/(self|cls)\b/, 'variable'],
      [/(\w+)/, 'text'],
    ]

    const lines = code.split('\n')
    lines.forEach((line, lineIdx) => {
      let remaining = line
      let leadingWhitespace = ''
      const wsMatch = line.match(/^(\s*)/)
      if (wsMatch) {
        leadingWhitespace = wsMatch[1]
        remaining = line.slice(leadingWhitespace.length)
      }

      if (leadingWhitespace) tokens.push({ type: 'text', text: leadingWhitespace })

      while (remaining.length > 0) {
        let matched = false
        for (const [regex, type] of patterns) {
          const match = remaining.match(regex)
          if (match && match.index === 0) {
            tokens.push({ type, text: match[0] })
            remaining = remaining.slice(match[0].length)
            matched = true
            break
          }
        }
        if (!matched) {
          tokens.push({ type: 'text', text: remaining[0] })
          remaining = remaining.slice(1)
        }
      }

      if (lineIdx < lines.length - 1) {
        tokens.push({ type: 'text', text: '\n' })
      }
    })

    return tokens
  }

  if (lang === 'javascript' || lang === 'typescript' || lang === 'js' || lang === 'ts') {
    const patterns: [RegExp, TokenType][] = [
      [/^(\s*)(\/\/.*|\/\*[\s\S]*?\*\/)/, 'comment'],
      [/(import|export|from|as|const|let|var|async|await|return|new|if|else|for|while|function|class|extends|super|this|typeof|instanceof|try|catch|finally|throw|switch|case|default|break|continue|delete|in|of|yield|null|undefined|true|false)\b/, 'keyword'],
      [/("(?:[^"\\]|\\.)*")/, 'string'],
      [/('(?:[^'\\]|\\.)*')/, 'string'],
      [/(`(?:[^`\\]|\\.)*`)/, 'string'],
      [/(\d+\.?\d*)/, 'number'],
      [/(\w+)(?=\()/g, 'function'],
      [/(\w+)(?=\s*=)/g, 'variable'],
      [/(\w+)/, 'text'],
    ]

    const lines = code.split('\n')
    lines.forEach((line, lineIdx) => {
      let remaining = line
      let leadingWhitespace = ''
      const wsMatch = line.match(/^(\s*)/)
      if (wsMatch) {
        leadingWhitespace = wsMatch[1]
        remaining = line.slice(leadingWhitespace.length)
      }

      if (leadingWhitespace) tokens.push({ type: 'text', text: leadingWhitespace })

      while (remaining.length > 0) {
        let matched = false
        for (const [regex, type] of patterns) {
          const match = remaining.match(regex)
          if (match && match.index === 0) {
            tokens.push({ type, text: match[0] })
            remaining = remaining.slice(match[0].length)
            matched = true
            break
          }
        }
        if (!matched) {
          tokens.push({ type: 'text', text: remaining[0] })
          remaining = remaining.slice(1)
        }
      }

      if (lineIdx < lines.length - 1) {
        tokens.push({ type: 'text', text: '\n' })
      }
    })

    return tokens
  }

  // Fallback: no highlighting
  return [{ type: 'text', text: code }]
}

function highlight(code: string, lang: string): string {
  const tokens = tokenize(code, lang)
  return tokens
    .map(t => {
      if (t.type === 'text') return t.text
      return `<span class="token-${t.type}">${t.text.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>')}</span>`
    })
    .join('')
}

export function CodeBlock({ code, language = 'bash', filename, showCopy = true }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const [flash, setFlash] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setFlash(true)
      setTimeout(() => setCopied(false), 2000)
      setTimeout(() => setFlash(false), 1500)
    } catch {
      // Clipboard API not available
    }
  }, [code])

  const html = highlight(code.trim(), language)

  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        fontFamily: 'var(--font-mono)',
      }}
    >
      {/* Terminal header bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid var(--color-border-muted)',
          background: 'var(--color-surface-2)',
          fontFamily: 'var(--font-mono)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Traffic lights — muted slate, purely decorative */}
          <div style={{ display: 'flex', gap: 6, marginRight: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-text-faint)', opacity: 0.6 }} />
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-text-faint)', opacity: 0.6 }} />
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-text-faint)', opacity: 0.6 }} />
          </div>
          {filename && (
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              {filename}
            </span>
          )}
          {language && !filename && (
            <span
              style={{
                fontSize: 10,
                color: 'var(--color-text-faint)',
                background: 'var(--color-border)',
                padding: '2px 8px',
                borderRadius: 4,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              {language}
            </span>
          )}
        </div>
        {showCopy && (
          <button
            onClick={handleCopy}
            aria-label={copied ? 'Copied!' : 'Copy code'}
            style={{
              background: flash ? 'var(--color-green)' : 'transparent',
              color: flash ? '#ffffff' : copied ? 'var(--color-green)' : 'var(--color-text-faint)',
              border: 'none',
              cursor: 'pointer',
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              padding: '4px 10px',
              borderRadius: 4,
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {flash ? (
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 8 7 12 13 4" />
              </svg>
            ) : copied ? (
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 8 7 12 13 4" />
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="8" height="8" rx="1" />
                <rect x="6" y="6" width="8" height="8" rx="1" />
              </svg>
            )}
            <span>{flash ? 'Copied' : copied ? 'Copied' : 'Copy'}</span>
          </button>
        )}
      </div>

      {/* Code content */}
      <div style={{ overflowX: 'auto' }}>
        <pre
          style={{
            margin: 0,
            padding: '20px',
            fontSize: 13,
            lineHeight: 1.6,
            color: 'var(--color-text-primary)',
            whiteSpace: 'pre',
            tabSize: 2,
          }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>

      <style>{`
        .token-comment   { color: var(--color-text-faint); font-style: italic; }
        .token-string    { color: var(--color-green); }
        .token-keyword   { color: var(--color-amber); }
        .token-function  { color: var(--color-indigo); }
        .token-variable  { color: var(--color-amber-dim); }
        .token-number    { color: var(--color-indigo-dim); }
      `}</style>
    </div>
  )
}

// Tabbed code block for multi-language examples
interface TabsProps {
  examples: { label: string; language: string; code: string }[]
}

export function TabbedCode({ examples }: TabsProps) {
  const [active, setActive] = useState(0)

  return (
    <div>
      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 2,
          marginBottom: -1,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {examples.map((ex, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            style={{
              padding: '8px 16px',
              fontSize: 13,
              fontFamily: 'var(--font-body)',
              fontWeight: 500,
              border: '1px solid',
              borderBottom: i === active ? '1px solid var(--color-surface)' : '1px solid var(--color-border)',
              borderColor: i === active ? 'var(--color-border)' : 'transparent',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              background: i === active ? 'var(--color-surface)' : 'transparent',
              color: i === active ? 'var(--color-text-primary)' : 'var(--color-text-faint)',
              transition: 'all 0.15s ease',
            }}
          >
            {ex.label}
          </button>
        ))}
      </div>
      <CodeBlock
        code={examples[active].code}
        language={examples[active].language}
        showCopy
      />
    </div>
  )
}