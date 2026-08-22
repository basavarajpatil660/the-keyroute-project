import { Sparkline } from './Sparkline'

type StatStatus = 'neutral' | 'good' | 'warning' | 'bad'

interface StatCardProps {
  label: string
  value: string
  trend: number[]
  status?: StatStatus
}

const STATUS_COLOR_MAP: Record<StatStatus, string> = {
  neutral: 'var(--color-text-primary)',
  good: 'var(--color-green)',
  warning: 'var(--color-amber)',
  bad: 'var(--color-red)',
}

export function StatCard({ label, value, trend, status = 'neutral' }: StatCardProps) {
  const valueColor = STATUS_COLOR_MAP[status]

  return (
    <div className="surface-card" style={{ padding: '16px 20px', minWidth: 140, flex: 1 }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-faint)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
        {label}
      </p>
      <p style={{ fontSize: 24, fontFamily: 'var(--font-display)', fontWeight: 700, color: valueColor, marginBottom: 10, lineHeight: 1.2 }}>
        {value}
      </p>
      <Sparkline data={trend} height={28} color={valueColor} />
    </div>
  )
}