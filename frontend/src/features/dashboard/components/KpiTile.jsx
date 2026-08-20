import React from 'react'
import '@/features/dashboard/dashboard.css'

function Sparkline({ points = [], color = '#3B82F6', width = 60, height = 24 }) {
  if (!Array.isArray(points) || points.length < 2) {
    return null
  }

  // Handle both array of numbers [0.1, 0.2] and array of objects [{x: 0, y: 0.1}]
  const values = points.map((p) => (typeof p === 'number' ? p : p?.y ?? 0))
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min === 0 ? 1 : max - min

  const svgPoints = values
    .map((val, idx) => {
      const x = (idx / (values.length - 1)) * (width - 4) + 2
      const y = height - 2 - ((val - min) / range) * (height - 4)
      return `${x},${y}`
    })
    .join(' ')

  const lastY = height - 2 - ((values[values.length - 1] - min) / range) * (height - 4)

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={svgPoints}
      />
      <circle cx={width - 2} cy={lastY} r="2.5" fill={color} />
    </svg>
  )
}

export default function KpiTile({
  hero = false,
  label,
  value,
  format = (v) => String(v),
  delta = undefined,
  lowerIsBetter = false,
  trend,
  caption,
}) {
  const isPositive = delta > 0
  const isNegative = delta < 0
  const isGood = lowerIsBetter ? isNegative : isPositive
  const isBad = lowerIsBetter ? isPositive : isNegative

  const deltaColor = isGood ? '#16A34A' : isBad ? '#DC2626' : '#6B7280'
  const deltaArrow = isPositive ? '▲' : isNegative ? '▼' : '•'

  return (
    <div
      className={`dsh-kpi-tile ${hero ? 'dsh-kpi-hero' : ''}`}
      style={{
        background: '#ffffff',
        borderRadius: '12px',
        border: hero ? '2px solid #2563EB' : '1px solid #E2E8F0',
        padding: '1.25rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#64748B' }}>{label}</span>
          {Array.isArray(trend) && <Sparkline points={trend} color={isGood ? '#16A34A' : '#2563EB'} />}
        </div>
        <div style={{ fontSize: hero ? '2.5rem' : '2rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>
          {format(value)}
        </div>
      </div>

      <div style={{ marginTop: '0.75rem' }}>
        {delta !== undefined && delta !== null && !isNaN(delta) && (
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: deltaColor, marginBottom: '0.25rem' }}>
            {deltaArrow} {Math.abs(delta * 100).toFixed(0)}% vs baseline
          </div>
        )}
        {caption && (
          <p style={{ margin: 0, fontSize: '0.75rem', color: '#94A3B8', lineHeight: 1.3 }}>
            {caption}
          </p>
        )}
      </div>
    </div>
  )
}