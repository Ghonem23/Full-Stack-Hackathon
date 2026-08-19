import { INK, SERIES } from '@/features/dashboard/theme'
import {
  Tooltip,
  XAxis,
  YAxis,
  hitProps,
  plotProps,
  roundedRightRect,
  roundedTopRect,
  scaleBand,
  scaleLinear,
  ticks,
  useChartWidth,
  useTooltip,
} from '@/features/dashboard/charts/primitives'

/* A 2px gap in the surface colour is what separates touching marks — never a
   stroke drawn around them, which would add ink that isn't data. */
const GAP = 2
const MAX_BAR = 24

/**
 * Grouped columns. One group per category, one column per series.
 *
 * groups: [{ name, values: [n, n, …] }]  aligned with seriesLabels
 */
export function GroupedColumns({
  groups,
  seriesLabels,
  height = 260,
  formatValue = (v) => v,
  yMax,
  rotateLabels = false,
}) {
  const [ref, width] = useChartWidth()
  const { tip, show, hide } = useTooltip()

  const pad = { top: 16, right: 12, bottom: rotateLabels ? 54 : 34, left: 46 }
  const plotW = Math.max(width - pad.left - pad.right, 10)
  const plotH = height - pad.top - pad.bottom

  const max = yMax ?? Math.max(...groups.flatMap((g) => g.values)) * 1.12
  const y = scaleLinear([0, max], [pad.top + plotH, pad.top])
  const band = scaleBand(groups.length, [pad.left, pad.left + plotW], 0.3)

  const seriesCount = seriesLabels.length
  const slot = band.bandWidth / seriesCount
  const barW = Math.min(slot - GAP, MAX_BAR)

  return (
    <div ref={ref} {...plotProps(hide)}>
      <svg width={width} height={height} role="img">
        <YAxis
          scale={y}
          values={ticks(0, max, 4)}
          format={formatValue}
          left={pad.left}
          right={pad.left + plotW}
        />

        {groups.map((group, gi) =>
          group.values.map((value, si) => {
            const color = SERIES[si % SERIES.length]
            const x = band.at(gi) + si * slot + (slot - barW) / 2
            const top = y(value)
            const barH = pad.top + plotH - top

            return (
              <path
                key={`${group.name}-${seriesLabels[si]}`}
                d={roundedTopRect(x, top, barW, barH)}
                fill={color}
                {...hitProps({
                  show,
                  hide,
                  x: x + barW / 2,
                  y: top,
                  label: group.name + ', ' + seriesLabels[si] + ' ' + formatValue(value),
                  content: (
                    <>
                      <strong>{group.name}</strong>
                      <span className="dsh-tip-row">
                        <span className="dsh-swatch" style={{ background: color }} />
                        {seriesLabels[si]}
                        <b>{formatValue(value)}</b>
                      </span>
                    </>
                  ),
                })}
              />
            )
          })
        )}

        <XAxis
          labels={groups.map((g) => g.name)}
          band={band}
          y={pad.top + plotH + (rotateLabels ? 18 : 20)}
          rotate={rotateLabels}
        />
      </svg>

      <Tooltip tip={tip} width={width} />
    </div>
  )
}

/**
 * Horizontal bars for a single series — the right form when the category
 * names are long enough that rotated column labels would be unreadable.
 *
 * Every bar wears the same colour. Shading each bar darker-where-bigger would
 * double-encode length as hue and spend the only free channel on information
 * the bar already shows.
 */
export function HorizontalBars({
  items,
  height = 220,
  color = SERIES[0],
  formatValue = (v) => v,
  valueSuffix = '',
}) {
  const [ref, width] = useChartWidth()
  const { tip, show, hide } = useTooltip()

  const labelW = 168
  const pad = { top: 6, right: 46, bottom: 6, left: labelW }
  const plotW = Math.max(width - pad.left - pad.right, 10)
  const rowH = (height - pad.top - pad.bottom) / Math.max(items.length, 1)
  const barH = Math.min(rowH - GAP * 3, MAX_BAR)

  const max = Math.max(...items.map((i) => i.value)) || 1
  const x = scaleLinear([0, max], [pad.left, pad.left + plotW])

  return (
    <div ref={ref} {...plotProps(hide)}>
      <svg width={width} height={height} role="img">
        {items.map((item, index) => {
          const yTop = pad.top + index * rowH + (rowH - barH) / 2
          const barW = x(item.value) - pad.left

          return (
            <g key={item.name}>
              <text
                x={labelW - 12}
                y={yTop + barH / 2 + 4}
                textAnchor="end"
                className="dsh-axis-text"
              >
                {item.name}
              </text>

              <path
                d={roundedRightRect(pad.left, yTop, barW, barH)}
                fill={color}
                {...hitProps({
                  show,
                  hide,
                  x: pad.left + barW,
                  y: yTop + barH / 2,
                  label: item.name + ': ' + formatValue(item.value) + valueSuffix,
                  content: (
                    <>
                      <strong>{item.name}</strong>
                      <span className="dsh-tip-row">
                        <span className="dsh-swatch" style={{ background: color }} />
                        <b>
                          {formatValue(item.value)}
                          {valueSuffix}
                        </b>
                      </span>
                    </>
                  ),
                })}
              />

              {/* Value sits outside the bar end, so it can never be clipped by
                  a short bar. */}
              <text
                x={pad.left + barW + 8}
                y={yTop + barH / 2 + 4}
                className="dsh-point-label"
              >
                {formatValue(item.value)}
              </text>
            </g>
          )
        })}
      </svg>

      <Tooltip tip={tip} width={width} />
    </div>
  )
}

/**
 * Stacked horizontal bars — used for the corpus, where each document splits
 * into clean and degraded chunks. Segments are separated by the surface gap.
 */
export function StackedBars({
  items,
  seriesLabels,
  colors,
  height = 220,
  labelWidth = 148,
}) {
  const [ref, width] = useChartWidth()
  const { tip, show, hide } = useTooltip()

  const pad = { top: 6, right: 52, bottom: 6, left: labelWidth }
  const plotW = Math.max(width - pad.left - pad.right, 10)
  const rowH = (height - pad.top - pad.bottom) / Math.max(items.length, 1)
  const barH = Math.min(rowH - GAP * 3, MAX_BAR)

  const totals = items.map((i) => i.values.reduce((a, b) => a + b, 0))
  const max = Math.max(...totals) || 1
  const scale = plotW / max

  return (
    <div ref={ref} {...plotProps(hide)}>
      <svg width={width} height={height} role="img">
        {items.map((item, index) => {
          const yTop = pad.top + index * rowH + (rowH - barH) / 2
          let cursor = pad.left

          return (
            <g key={item.name}>
              <text
                x={labelWidth - 12}
                y={yTop + barH / 2 + 4}
                textAnchor="end"
                className="dsh-axis-text"
              >
                {item.name}
              </text>

              {item.values.map((value, si) => {
                const isLast = si === item.values.length - 1
                const rawW = value * scale
                const segW = Math.max(rawW - (isLast ? 0 : GAP), 0)
                const x = cursor
                cursor += rawW

                const path = isLast
                  ? roundedRightRect(x, yTop, segW, barH)
                  : `M${x},${yTop} h${segW} v${barH} h${-segW} Z`

                return (
                  <path
                    key={seriesLabels[si]}
                    d={path}
                    fill={colors[si]}
                    {...hitProps({
                      show,
                      hide,
                      x: x + segW / 2,
                      y: yTop + barH / 2,
                      label: item.name + ', ' + seriesLabels[si] + ' ' + value,
                      content: (
                        <>
                          <strong>{item.name}</strong>
                          <span className="dsh-tip-row">
                            <span
                              className="dsh-swatch"
                              style={{ background: colors[si] }}
                            />
                            {seriesLabels[si]}
                            <b>{value}</b>
                          </span>
                        </>
                      ),
                    })}
                  />
                )
              })}

              <text
                x={pad.left + totals[index] * scale + 8}
                y={yTop + barH / 2 + 4}
                className="dsh-point-label"
              >
                {totals[index]}
              </text>
            </g>
          )
        })}
      </svg>

      <Tooltip tip={tip} width={width} />
    </div>
  )
}

/**
 * Histogram of similarity scores with the refusal threshold marked.
 *
 * The two colours here encode a state — answered vs refused by the gate — not
 * two data series, which is why a status colour is the right choice for the
 * refused side. The threshold rule is solid, and labelled, so the split never
 * rests on colour alone.
 */
export function ThresholdHistogram({
  bins,
  threshold,
  height = 250,
  belowColor,
  aboveColor = SERIES[0],
}) {
  const [ref, width] = useChartWidth()
  const { tip, show, hide } = useTooltip()

  const pad = { top: 22, right: 14, bottom: 40, left: 42 }
  const plotW = Math.max(width - pad.left - pad.right, 10)
  const plotH = height - pad.top - pad.bottom

  const max = Math.max(...bins.map((b) => b.count)) * 1.15
  const y = scaleLinear([0, max], [pad.top + plotH, pad.top])
  const band = scaleBand(bins.length, [pad.left, pad.left + plotW], 0.18)
  const barW = Math.min(band.bandWidth, MAX_BAR + 8)

  // The gate sits between two bins; place the rule at the boundary rather than
  // on a bar centre, because a score of exactly 0.76 passes.
  const gateIndex = bins.findIndex((b) => b.bin >= threshold)
  const gateX =
    gateIndex <= 0 ? pad.left : band.at(gateIndex) - (band.step - band.bandWidth) / 2

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
          const below = bin.bin < threshold
          const color = below ? belowColor : aboveColor
          const x = band.at(index) + (band.bandWidth - barW) / 2
          const top = y(bin.count)

          return (
            <path
              key={bin.bin}
              d={roundedTopRect(x, top, barW, pad.top + plotH - top)}
              fill={color}
              {...hitProps({
                show,
                hide,
                x: x + barW / 2,
                y: top,
                label:
                  'Similarity ' + bin.bin.toFixed(2) + ', ' + bin.count + ' chunks, ' +
                  (below ? 'refused by gate' : 'answered'),
                content: (
                  <>
                    <strong>Similarity {bin.bin.toFixed(2)}</strong>
                    <span className="dsh-tip-row">
                      <span className="dsh-swatch" style={{ background: color }} />
                      {below ? 'Refused by gate' : 'Answered'}
                      <b>{bin.count} chunks</b>
                    </span>
                  </>
                ),
              })}
            />
          )
        })}

        <line
          x1={gateX}
          x2={gateX}
          y1={pad.top - 6}
          y2={pad.top + plotH}
          stroke={INK.secondary}
          strokeWidth="1.5"
        />
        <text x={gateX + 6} y={pad.top - 8} className="dsh-rule-label">
          Gate {threshold.toFixed(2)}
        </text>

        <XAxis
          labels={bins.map((b) => b.bin.toFixed(2))}
          band={band}
          y={pad.top + plotH + 20}
        />
        <text
          x={pad.left + plotW / 2}
          y={height - 4}
          textAnchor="middle"
          className="dsh-axis-title"
        >
          Cosine similarity of retrieved chunk
        </text>
      </svg>

      <Tooltip tip={tip} width={width} />
    </div>
  )
}
