import { INK, SERIES } from '@/features/dashboard/theme'
import {
  Tooltip,
  YAxis,
  plotProps,
  scaleLinear,
  ticks,
  useChartWidth,
  useTooltip,
} from '@/features/dashboard/charts/primitives'

/**
 * EDSS against Beck total, one mark per occupied position.
 *
 * EDSS only moves in half steps, so a thousand patients land on about sixty
 * distinct x values and a plain scatter would draw most of them on top of each
 * other — the plot would show where patients *can* sit, not where they *do*.
 * Identical (x, y) pairs are therefore collapsed into one circle sized by how
 * many patients share it, which is the same information the density plot in
 * the team's analysis carries, without the overplotting.
 *
 * Area, not radius, is proportional to the count: a circle that reads as twice
 * as big is twice as many patients.
 */

const MIN_R = 2.6
const MAX_R = 9

export default function Scatter({
  points,
  trend = [],
  xDomain = [0, 9.5],
  yDomain = [0, 60],
  height = 300,
  xLabel,
  yLabel,
}) {
  const [ref, width] = useChartWidth()
  const { tip, show, hide } = useTooltip()

  const pad = { top: 14, right: 16, bottom: 42, left: 48 }
  const plotW = Math.max(width - pad.left - pad.right, 10)
  const plotH = height - pad.top - pad.bottom

  const x = scaleLinear(xDomain, [pad.left, pad.left + plotW])
  const y = scaleLinear(yDomain, [pad.top + plotH, pad.top])

  const cells = collapse(points)
  const busiest = Math.max(...cells.map((c) => c.count), 1)
  const radius = (count) =>
    MIN_R + (MAX_R - MIN_R) * Math.sqrt((count - 1) / Math.max(busiest - 1, 1))

  const trendPath = trend
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.x)},${y(p.y)}`)
    .join(' ')

  return (
    <div ref={ref} {...plotProps(hide)}>
      <svg width={width} height={height} role="img" aria-label={describe(cells, trend)}>
        <YAxis
          scale={y}
          values={ticks(yDomain[0], yDomain[1], 4)}
          format={(v) => Math.round(v)}
          left={pad.left}
          right={pad.left + plotW}
        />

        {/* Every mark below is pointer-reachable but none of them is a tab
            stop: four hundred focus stops in one card would bury the rest of
            the section for a keyboard user. The card's table view carries the
            same numbers, and the trend line is summarised in the aria-label. */}
        {cells.map((cell) => (
          <circle
            key={`${cell.x}-${cell.y}`}
            cx={x(cell.x)}
            cy={y(cell.y)}
            r={radius(cell.count)}
            fill={SERIES[0]}
            fillOpacity={0.42}
            onMouseMove={(event) => {
              const box = event.currentTarget.ownerSVGElement.getBoundingClientRect()
              show(
                x(cell.x),
                event.clientY - box.top,
                <>
                  <strong>EDSS {cell.x}</strong>
                  <span className="dsh-tip-row">
                    Beck score<b>{cell.y}</b>
                  </span>
                  <span className="dsh-tip-row">
                    Patients here<b>{cell.count}</b>
                  </span>
                </>
              )
            }}
          />
        ))}

        {trend.length > 1 && (
          <>
            <path
              d={trendPath}
              fill="none"
              stroke={SERIES[1]}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {trend.map((point) => (
              <circle
                key={point.x}
                cx={x(point.x)}
                cy={y(point.y)}
                r="3"
                fill={SERIES[1]}
                stroke={INK.surface}
                strokeWidth="1.5"
              />
            ))}
          </>
        )}

        {/* The x axis is continuous here, so it gets its own ruled ticks
            rather than the shared categorical XAxis. */}
        <g aria-hidden="true">
          <line
            x1={pad.left}
            x2={pad.left + plotW}
            y1={pad.top + plotH}
            y2={pad.top + plotH}
            stroke={INK.axis}
            shapeRendering="crispEdges"
          />
          {ticks(xDomain[0], xDomain[1], 5).map((value) => (
            <text
              key={value}
              x={x(value)}
              y={pad.top + plotH + 18}
              textAnchor="middle"
              className="dsh-axis-text"
            >
              {Number(value.toFixed(1))}
            </text>
          ))}
          {xLabel && (
            <text
              x={pad.left + plotW / 2}
              y={height - 4}
              textAnchor="middle"
              className="dsh-axis-title"
            >
              {xLabel}
            </text>
          )}
          {yLabel && (
            <text
              transform={`rotate(-90 12 ${pad.top + plotH / 2})`}
              x={12}
              y={pad.top + plotH / 2}
              textAnchor="middle"
              className="dsh-axis-title"
            >
              {yLabel}
            </text>
          )}
        </g>
      </svg>

      <Tooltip tip={tip} width={width} />
    </div>
  )
}

/** Identical coordinates become one mark carrying the count. */
function collapse(points) {
  const seen = new Map()

  points.forEach((point) => {
    const key = `${point.x}|${point.y}`
    const existing = seen.get(key)
    if (existing) existing.count += 1
    else seen.set(key, { x: point.x, y: point.y, count: 1 })
  })

  // Densest last so the biggest circles are not hidden under the small ones.
  return [...seen.values()].sort((a, b) => a.count - b.count)
}

function describe(cells, trend) {
  const patients = cells.reduce((sum, cell) => sum + cell.count, 0)
  if (!trend.length) return `${patients} patients plotted by EDSS and Beck score.`

  const first = trend[0]
  const last = trend[trend.length - 1]
  return (
    `${patients} patients plotted by EDSS and Beck score. ` +
    `Median Beck rises from ${first.y} at EDSS ${first.x} to ${last.y} at EDSS ${last.x}.`
  )
}
