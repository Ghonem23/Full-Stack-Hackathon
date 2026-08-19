import { INK, SERIES } from '@/features/dashboard/theme'
import {
  Tooltip,
  YAxis,
  hitProps,
  plotProps,
  roundedTopRect,
  scaleLinear,
  ticks,
  useChartWidth,
  useTooltip,
} from '@/features/dashboard/charts/primitives'

/**
 * Counts over equal-width numeric bins.
 *
 * This is not the grouped-column chart with a numeric label: the bars touch,
 * because the x axis is continuous and a gap between them would suggest the
 * values in between cannot occur. The existing ThresholdHistogram is the same
 * form but exists to colour one side of a cut-off, which is not what is being
 * shown here.
 */
export default function Histogram({
  bins,
  height = 230,
  color = SERIES[0],
  xLabel,
  formatBin = (bin) => `${bin.start}–${bin.end - 1}`,
  unit = 'patients',
}) {
  const [ref, width] = useChartWidth()
  const { tip, show, hide } = useTooltip()

  const pad = { top: 14, right: 14, bottom: 38, left: 44 }
  const plotW = Math.max(width - pad.left - pad.right, 10)
  const plotH = height - pad.top - pad.bottom

  const max = Math.max(...bins.map((b) => b.value), 1) * 1.12
  const y = scaleLinear([0, max], [pad.top + plotH, pad.top])
  const barW = plotW / Math.max(bins.length, 1)

  // Only every other bin gets a printed edge once they are narrow, otherwise
  // the labels collide and none of them can be read.
  const labelEvery = barW < 34 ? 2 : 1

  return (
    <div ref={ref} {...plotProps(hide)}>
      <svg width={width} height={height} role="img">
        <YAxis
          scale={y}
          values={ticks(0, max, 4)}
          format={(v) => Math.round(v)}
          left={pad.left}
          right={pad.left + plotW}
        />

        {bins.map((bin, index) => {
          const x = pad.left + index * barW
          const top = y(bin.value)

          return (
            <path
              key={bin.start}
              d={roundedTopRect(x + 0.5, top, barW - 1, pad.top + plotH - top, 3)}
              fill={color}
              {...hitProps({
                show,
                hide,
                x: x + barW / 2,
                y: top,
                label: `${formatBin(bin)}: ${bin.value} ${unit}`,
                content: (
                  <>
                    <strong>{formatBin(bin)}</strong>
                    <span className="dsh-tip-row">
                      {unit}
                      <b>{bin.value}</b>
                    </span>
                  </>
                ),
              })}
            />
          )
        })}

        <g aria-hidden="true">
          <line
            x1={pad.left}
            x2={pad.left + plotW}
            y1={pad.top + plotH}
            y2={pad.top + plotH}
            stroke={INK.axis}
            shapeRendering="crispEdges"
          />
          {bins.map((bin, index) =>
            index % labelEvery === 0 ? (
              <text
                key={bin.start}
                x={pad.left + index * barW}
                y={pad.top + plotH + 17}
                textAnchor="middle"
                className="dsh-axis-text"
              >
                {bin.start}
              </text>
            ) : null
          )}
          {xLabel && (
            <text
              x={pad.left + plotW / 2}
              y={height - 3}
              textAnchor="middle"
              className="dsh-axis-title"
            >
              {xLabel}
            </text>
          )}
        </g>
      </svg>

      <Tooltip tip={tip} width={width} />
    </div>
  )
}
