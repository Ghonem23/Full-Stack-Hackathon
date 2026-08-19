import { INK, SERIES, STATUS } from '@/features/dashboard/theme'

/**
 * Stat tile: label · value · delta vs the baseline run · 7-point sparkline.
 *
 * Some of these metrics are better when they fall — the unsupported-claim rate
 * above all — so direction and goodness are tracked separately. An arrow that
 * points down and is still green is correct here, and the caption spells it
 * out so nobody has to infer it from the colour.
 */
export default function KpiTile({
  label,
  value,
  format,
  delta,
  lowerIsBetter = false,
  trend = [],
  caption,
  hero = false,
  deltaLabel = 'vs baseline',
}) {
  const improved = lowerIsBetter ? delta < 0 : delta > 0
  const flat = Math.abs(delta) < 0.0005
  const arrow = delta > 0 ? '▲' : '▼'

  // The hero tile sits on a navy gradient, so it needs its own pair of steps —
  // the standard green and red are both too dark to read against it.
  const tone = flat
    ? hero
      ? 'rgba(255,255,255,0.72)'
      : INK.muted
    : improved
      ? hero
        ? '#9ff0a4'
        : STATUS.good
      : hero
        ? '#ffb0ac'
        : STATUS.critical

  return (
    <article className={`dsh-kpi${hero ? ' dsh-kpi--hero' : ''}`}>
      <p className="dsh-kpi-label">{label}</p>

      <div className="dsh-kpi-row">
        <span className="dsh-kpi-value">{format(value)}</span>
        {trend.length > 1 && <Sparkline points={trend} />}
      </div>

      {!flat && (
        <p className="dsh-kpi-delta" style={{ color: tone }}>
          <span aria-hidden="true">{arrow}</span>{' '}
          {format(Math.abs(delta))} {deltaLabel}
          <span className="dsh-sr">
            {improved ? ' — improved' : ' — regressed'}
          </span>
        </p>
      )}

      {caption && <p className="dsh-kpi-caption">{caption}</p>}
    </article>
  )
}

/** 12-point-max sparkline. No axes, no labels — it carries shape, not values. */
function Sparkline({ points, width = 78, height = 30 }) {
  const min = Math.min(...points)
  const max = Math.max(...points)
  const span = max - min || 1

  const x = (i) => (i / (points.length - 1)) * (width - 4) + 2
  const y = (v) => height - 3 - ((v - min) / span) * (height - 8)

  const path = points.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(v)}`).join(' ')
  const lastX = x(points.length - 1)
  const lastY = y(points[points.length - 1])

  return (
    <svg width={width} height={height} className="dsh-spark" aria-hidden="true">
      <path
        d={path}
        fill="none"
        stroke={INK.axis}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={lastX}
        cy={lastY}
        r="3.5"
        fill={SERIES[0]}
        stroke={INK.surface}
        strokeWidth="2"
      />
    </svg>
  )
}
