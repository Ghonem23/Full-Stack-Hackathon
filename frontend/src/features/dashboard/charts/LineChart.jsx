import { Fragment } from 'react'
import { INK, SERIES } from '@/features/dashboard/theme'
import {
  Tooltip,
  YAxis,
  hitProps,
  plotProps,
  scaleLinear,
  ticks,
  useChartWidth,
  useTooltip,
} from '@/features/dashboard/charts/primitives'

/**
 * Multi-series line chart on a single y-axis.
 *
 * Deliberately single-axis: two measures on two scales invent a correlation
 * that isn't in the data. When two measures need showing, the dashboard uses
 * two charts side by side instead.
 *
 * series: [{ label, points: [{ x, y }] }]
 */
export default function LineChart({
  series,
  height = 250,
  yDomain,
  formatY = (v) => v,
  formatX = (v) => v,
  formatValue,
  xLabel,
  labelLast = true,
}) {
  const [ref, width] = useChartWidth()
  const { tip, show, hide } = useTooltip()

  const pad = { top: 18, right: labelLast ? 62 : 22, bottom: 34, left: 46 }
  const plotW = Math.max(width - pad.left - pad.right, 10)
  const plotH = height - pad.top - pad.bottom

  const allX = series.flatMap((s) => s.points.map((p) => p.x))
  const allY = series.flatMap((s) => s.points.map((p) => p.y))
  const domainY = yDomain ?? [0, Math.max(...allY) * 1.15]

  const x = scaleLinear([Math.min(...allX), Math.max(...allX)], [pad.left, pad.left + plotW])
  const y = scaleLinear(domainY, [pad.top + plotH, pad.top])
  const yTicks = ticks(domainY[0], domainY[1], 4)
  const readValue = formatValue ?? formatY

  // One x tick per distinct x, so the K values (1, 3, 5, 10) all get a label
  // instead of being interpolated into round numbers that were never measured.
  const xTicks = [...new Set(allX)].sort((a, b) => a - b)

  return (
    <div ref={ref} {...plotProps(hide)}>
      <svg width={width} height={height} role="img">
        <YAxis
          scale={y}
          values={yTicks}
          format={formatY}
          left={pad.left}
          right={pad.left + plotW}
        />

        {xTicks.map((value) => (
          <text
            key={value}
            x={x(value)}
            y={pad.top + plotH + 20}
            textAnchor="middle"
            className="dsh-axis-text"
          >
            {formatX(value)}
          </text>
        ))}

        {xLabel && (
          <text
            x={pad.left + plotW / 2}
            y={height - 2}
            textAnchor="middle"
            className="dsh-axis-title"
          >
            {xLabel}
          </text>
        )}

        {series.map((line, index) => {
          const color = SERIES[index % SERIES.length]
          const path = line.points
            .map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.x)},${y(p.y)}`)
            .join(' ')
          const last = line.points[line.points.length - 1]

          return (
            <Fragment key={line.label}>
              <path
                d={path}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {line.points.map((point) => (
                <circle
                  key={`${line.label}-${point.x}`}
                  cx={x(point.x)}
                  cy={y(point.y)}
                  r="4.5"
                  fill={color}
                  stroke={INK.surface}
                  strokeWidth="2"
                />
              ))}

              {/* Only the endpoint is directly labelled. A number on every
                  point is noise nobody reads. */}
              {labelLast && last && (
                <text
                  x={x(last.x) + 12}
                  y={y(last.y) + 4}
                  className="dsh-point-label"
                >
                  {readValue(last.y)}
                </text>
              )}
            </Fragment>
          )
        })}

        {/* Invisible hit columns — a wide target beats asking anyone to land
            on a 9px dot, and it gives touch and keyboard something to aim at. */}
        {xTicks.map((value) => {
          const cx = x(value)
          const bandW = Math.max(plotW / Math.max(xTicks.length, 1), 28)
          const heading = xLabel ? `${xLabel} ${formatX(value)}` : formatX(value)
          const hits = series
            .map((line) => ({ line, point: line.points.find((p) => p.x === value) }))
            .filter((entry) => entry.point)

          return (
            <rect
              key={`hit-${value}`}
              x={cx - bandW / 2}
              y={pad.top}
              width={bandW}
              height={plotH}
              fill="transparent"
              {...hitProps({
                show,
                hide,
                x: cx,
                y: pad.top + plotH / 2,
                label: `${heading}. ${hits
                  .map(({ line, point }) => `${line.label} ${readValue(point.y)}`)
                  .join(', ')}`,
                content: (
                  <>
                    <strong>{heading}</strong>
                    {hits.map(({ line, point }) => (
                      <span className="dsh-tip-row" key={line.label}>
                        <span
                          className="dsh-swatch"
                          style={{
                            background: SERIES[series.indexOf(line) % SERIES.length],
                          }}
                        />
                        {line.label}
                        <b>{readValue(point.y)}</b>
                      </span>
                    ))}
                  </>
                ),
              })}
            />
          )
        })}
      </svg>

      <Tooltip tip={tip} width={width} />
    </div>
  )
}
