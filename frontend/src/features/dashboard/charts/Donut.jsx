import {
  Tooltip,
  hitProps,
  plotProps,
  useChartWidth,
  useTooltip,
} from '@/features/dashboard/charts/primitives'

/**
 * Part-to-whole donut, capped at a handful of segments.
 *
 * Confidence tiers are an *ordered* category (High → Insufficient), so the
 * segments take the ordinal blue ramp rather than four unrelated hues — the
 * darkening reads as "further down the scale". The total sits in the middle,
 * which is the only number the reader needs before the legend.
 */
export default function Donut({ segments, colors, centerLabel, height = 230 }) {
  const [ref, width] = useChartWidth(260)
  const { tip, show, hide } = useTooltip()

  const size = Math.min(width, height)
  const cx = width / 2
  const cy = height / 2
  const outer = size / 2 - 8
  const inner = outer * 0.62

  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1
  let angle = -Math.PI / 2

  // A 2px gap in the surface colour separates neighbouring segments, so the
  // boundary reads without a stroke around each arc.
  const gapAngle = 2 / outer

  return (
    <div ref={ref} {...plotProps(hide)} className="dsh-plot dsh-plot--center">
      <svg width={width} height={height} role="img">
        {segments.map((segment, index) => {
          const sweep = (segment.value / total) * Math.PI * 2
          const start = angle + gapAngle / 2
          const end = angle + sweep - gapAngle / 2
          angle += sweep

          const path = arcPath(cx, cy, inner, outer, start, end)
          const mid = (start + end) / 2

          return (
            <path
              key={segment.label}
              d={path}
              fill={colors[index]}
              {...hitProps({
                show,
                hide,
                x: cx + Math.cos(mid) * outer * 0.8,
                y: cy + Math.sin(mid) * outer * 0.8,
                label:
                  segment.label + ': ' + segment.value + ' of ' + total + ', ' +
                  Math.round((segment.value / total) * 100) + '%',
                content: (
                  <>
                    <strong>{segment.label}</strong>
                    <span className="dsh-tip-row">
                      <span
                        className="dsh-swatch"
                        style={{ background: colors[index] }}
                      />
                      <b>
                        {segment.value} of {total} ·{' '}
                        {Math.round((segment.value / total) * 100)}%
                      </b>
                    </span>
                  </>
                ),
              })}
            />
          )
        })}

        <text x={cx} y={cy - 2} textAnchor="middle" className="dsh-donut-value">
          {total}
        </text>
        <text x={cx} y={cy + 18} textAnchor="middle" className="dsh-donut-label">
          {centerLabel}
        </text>
      </svg>

      <Tooltip tip={tip} width={width} />
    </div>
  )
}

function arcPath(cx, cy, inner, outer, start, end) {
  const large = end - start > Math.PI ? 1 : 0
  const p = (r, a) => [cx + Math.cos(a) * r, cy + Math.sin(a) * r]

  const [x1, y1] = p(outer, start)
  const [x2, y2] = p(outer, end)
  const [x3, y3] = p(inner, end)
  const [x4, y4] = p(inner, start)

  return [
    `M${x1},${y1}`,
    `A${outer},${outer} 0 ${large} 1 ${x2},${y2}`,
    `L${x3},${y3}`,
    `A${inner},${inner} 0 ${large} 0 ${x4},${y4}`,
    'Z',
  ].join(' ')
}

/**
 * The guardrail funnel: how many of the incoming queries survive each safety
 * stage. Ordered stages, so the ordinal ramp again — and the drop-off between
 * stages is called out in words, because that number is the whole point.
 */
export function Funnel({ stages, colors }) {
  const top = stages[0]?.value || 1

  return (
    <ol className="dsh-funnel">
      {stages.map((stage, index) => {
        const share = stage.value / top
        const previous = index === 0 ? null : stages[index - 1].value
        const dropped = previous === null ? 0 : previous - stage.value

        return (
          <li
            key={stage.stage}
            tabIndex={0}
            aria-label={
              stage.stage + ': ' + stage.value + ' queries, ' +
              Math.round(share * 100) + '% of intake' +
              (dropped > 0 ? ', ' + dropped + ' withheld at this stage' : '')
            }
          >
            <div className="dsh-funnel-head">
              <span className="dsh-funnel-stage">{stage.stage}</span>
              <span className="dsh-funnel-value">
                {stage.value}
                <span className="dsh-funnel-share">{Math.round(share * 100)}%</span>
              </span>
            </div>

            <div className="dsh-funnel-track">
              <div
                className="dsh-funnel-fill"
                style={{ width: `${share * 100}%`, background: colors[index] }}
              />
            </div>

            {dropped > 0 && (
              <p className="dsh-funnel-drop">
                <span aria-hidden="true">↳</span> {dropped} withheld at this stage
              </p>
            )}
          </li>
        )
      })}
    </ol>
  )
}
