import { INK, RAMP } from '@/features/dashboard/theme'
import { Tooltip, plotProps, useChartWidth, useTooltip } from '@/features/dashboard/charts/primitives'

/**
 * Row-percentage matrix: disability band down the side, depression category
 * across the top.
 *
 * Each row sums to 100%, which is the comparison that matters — the bands hold
 * very different numbers of patients, so raw counts would say more about how
 * common each band is than about how depression is distributed inside it.
 *
 * The scale is one hue, light to dark, because the value is a magnitude with a
 * zero and no meaningful midpoint. A red-to-green scale would be both a
 * colour-blind hazard and a claim that some percentage is "good".
 *
 * Pass onPick to make a cell act as a filter on its row band.
 */
export default function Heatmap({ rows, columns, height = 240, onPick, selectedRow }) {
  const [ref, width] = useChartWidth()
  const { tip, show, hide } = useTooltip()

  const pad = { top: 30, right: 12, bottom: 8, left: 132 }
  const gridW = Math.max(width - pad.left - pad.right, 10)
  const gridH = height - pad.top - pad.bottom

  const cellW = gridW / columns.length
  const cellH = gridH / Math.max(rows.length, 1)
  const peak = Math.max(...rows.flatMap((row) => row.cells.map((c) => c.value)), 0.01)

  return (
    <div ref={ref} {...plotProps(hide)}>
      <svg width={width} height={height} role="img">
        {columns.map((column, ci) => (
          <text
            key={column.id}
            x={pad.left + ci * cellW + cellW / 2}
            y={pad.top - 12}
            textAnchor="middle"
            className="dsh-axis-text"
          >
            {column.label}
          </text>
        ))}

        {rows.map((row, ri) => (
          <g key={row.id}>
            <text
              x={pad.left - 12}
              y={pad.top + ri * cellH + cellH / 2 + 4}
              textAnchor="end"
              className="dsh-axis-text"
            >
              {row.label}
            </text>

            {row.cells.map((cell, ci) => {
              const shade = ramp(cell.value / peak)
              const dark = cell.value / peak > 0.55
              const dimmed = selectedRow != null && selectedRow !== row.id

              const content = (
                <>
                  <strong>{row.label}</strong>
                  <span className="dsh-tip-row">
                    {cell.label} depression<b>{Math.round(cell.value * 100)}%</b>
                  </span>
                  <span className="dsh-tip-row">
                    Patients<b>{cell.count} of {row.total}</b>
                  </span>
                </>
              )

              return (
                <g
                  key={cell.id}
                  className={`dsh-heat-cell${onPick ? ' is-pickable' : ''}${dimmed ? ' is-dimmed' : ''}`}
                  tabIndex={0}
                  role={onPick ? 'button' : 'img'}
                  aria-label={
                    `${row.label}, ${cell.label} depression: ` +
                    `${Math.round(cell.value * 100)} percent, ${cell.count} of ${row.total} patients` +
                    (onPick ? '. Activate to filter the section by this band.' : '')
                  }
                  onMouseMove={(event) => {
                    const box = event.currentTarget.ownerSVGElement.getBoundingClientRect()
                    show(pad.left + ci * cellW + cellW / 2, event.clientY - box.top, content)
                  }}
                  onFocus={() => show(pad.left + ci * cellW + cellW / 2, pad.top + ri * cellH, content)}
                  onBlur={hide}
                  onClick={() => onPick?.(row.id)}
                  onKeyDown={(event) => {
                    if (!onPick) return
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      onPick(row.id)
                    }
                  }}
                >
                  <rect
                    x={pad.left + ci * cellW + 1}
                    y={pad.top + ri * cellH + 1}
                    width={cellW - 2}
                    height={cellH - 2}
                    rx="6"
                    fill={shade}
                  />
                  {/* The number is printed in every cell: colour alone cannot
                      be read precisely, and this panel is the one people quote
                      a figure from. */}
                  <text
                    x={pad.left + ci * cellW + cellW / 2}
                    y={pad.top + ri * cellH + cellH / 2 + 5}
                    textAnchor="middle"
                    className="dsh-heat-value"
                    fill={dark ? '#ffffff' : INK.primary}
                  >
                    {Math.round(cell.value * 100)}%
                  </text>
                </g>
              )
            })}
          </g>
        ))}
      </svg>

      <Tooltip tip={tip} width={width} />
    </div>
  )
}

/** Blends the ordinal ramp so the scale is continuous, not five steps. */
function ramp(t) {
  const clamped = Math.min(Math.max(t, 0), 1)
  const scaled = clamped * (RAMP.length - 1)
  const low = Math.floor(scaled)
  const high = Math.min(low + 1, RAMP.length - 1)
  return mix(RAMP[low], RAMP[high], scaled - low)
}

function mix(from, to, t) {
  const a = parse(from)
  const b = parse(to)
  const channel = (i) => Math.round(a[i] + (b[i] - a[i]) * t)
  return `rgb(${channel(0)}, ${channel(1)}, ${channel(2)})`
}

const parse = (hex) => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
]
