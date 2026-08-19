import { INK, SERIES } from '@/features/dashboard/theme'
import {
  Tooltip,
  XAxis,
  YAxis,
  plotProps,
  scaleBand,
  scaleLinear,
  ticks,
  useChartWidth,
  useTooltip,
} from '@/features/dashboard/charts/primitives'

/**
 * Box and whisker, one box per band.
 *
 * The Beck total is bounded at zero and heavily right-skewed — a bar of means
 * would hide that a large share of every band scores near zero while a tail
 * runs to 58. The box shows the median and the middle half directly, so two
 * bands can be compared without either of them pretending to be symmetric.
 *
 * Whiskers stop at 1.5 IQR and everything past them is drawn as its own point,
 * which is the convention the statistical plots in the source analysis use.
 *
 * Pass onPick to make the boxes act as a filter: clicking one selects that
 * band, clicking the selected one clears it.
 */

const MAX_BOX = 76

export default function BoxPlot({
  groups,
  height = 280,
  yMax = 60,
  yLabel,
  onPick,
  selected,
  rotateLabels = false,
}) {
  const [ref, width] = useChartWidth()
  const { tip, show, hide } = useTooltip()

  const pad = { top: 14, right: 14, bottom: rotateLabels ? 52 : 34, left: 48 }
  const plotW = Math.max(width - pad.left - pad.right, 10)
  const plotH = height - pad.top - pad.bottom

  const y = scaleLinear([0, yMax], [pad.top + plotH, pad.top])
  const band = scaleBand(groups.length, [pad.left, pad.left + plotW], 0.42)
  const boxW = Math.min(band.bandWidth, MAX_BOX)

  return (
    <div ref={ref} {...plotProps(hide)}>
      <svg width={width} height={height} role="img">
        <YAxis
          scale={y}
          values={ticks(0, yMax, 4)}
          format={(v) => Math.round(v)}
          left={pad.left}
          right={pad.left + plotW}
        />

        {groups.map((group, index) => {
          const centre = band.at(index) + band.bandWidth / 2
          const left = centre - boxW / 2
          const dimmed = selected != null && selected !== group.id

          const content = (
            <>
              <strong>{group.title || group.label}</strong>
              <span className="dsh-tip-row">
                Median<b>{round(group.median)}</b>
              </span>
              <span className="dsh-tip-row">
                Middle half<b>{round(group.q1)} – {round(group.q3)}</b>
              </span>
              <span className="dsh-tip-row">
                Patients<b>{group.n}</b>
              </span>
            </>
          )

          const label =
            `${group.label}: median ${round(group.median)}, ` +
            `quartiles ${round(group.q1)} to ${round(group.q3)}, ${group.n} patients` +
            (onPick ? '. Activate to filter the section by this band.' : '')

          return (
            <g
              key={group.id}
              className={`dsh-box${onPick ? ' is-pickable' : ''}${dimmed ? ' is-dimmed' : ''}`}
              tabIndex={0}
              role={onPick ? 'button' : 'img'}
              aria-pressed={onPick ? selected === group.id : undefined}
              aria-label={label}
              onMouseMove={(event) => {
                const box = event.currentTarget.ownerSVGElement.getBoundingClientRect()
                show(centre, event.clientY - box.top, content)
              }}
              onTouchStart={() => show(centre, y(group.median), content)}
              onFocus={() => show(centre, y(group.median), content)}
              onBlur={hide}
              onClick={() => onPick?.(group.id)}
              onKeyDown={(event) => {
                if (!onPick) return
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onPick(group.id)
                }
              }}
            >
              {/* Whisker, drawn first so the box sits over it. */}
              <line
                x1={centre}
                x2={centre}
                y1={y(group.min)}
                y2={y(group.max)}
                stroke={INK.muted}
                strokeWidth="1.5"
              />
              <line
                x1={centre - boxW / 4}
                x2={centre + boxW / 4}
                y1={y(group.min)}
                y2={y(group.min)}
                stroke={INK.muted}
                strokeWidth="1.5"
              />
              <line
                x1={centre - boxW / 4}
                x2={centre + boxW / 4}
                y1={y(group.max)}
                y2={y(group.max)}
                stroke={INK.muted}
                strokeWidth="1.5"
              />

              <rect
                x={left}
                y={y(group.q3)}
                width={boxW}
                height={Math.max(y(group.q1) - y(group.q3), 1)}
                rx="4"
                fill={SERIES[0]}
                fillOpacity={selected === group.id ? 0.55 : 0.28}
                stroke={SERIES[0]}
                strokeWidth="1.5"
              />

              {/* The median is the one line that must never be mistaken for a
                  box edge, so it is the heaviest mark in the group. */}
              <line
                x1={left}
                x2={left + boxW}
                y1={y(group.median)}
                y2={y(group.median)}
                stroke={INK.primary}
                strokeWidth="2.5"
              />

              {group.outliers.map((value, i) => (
                <circle
                  key={`${value}-${i}`}
                  cx={centre}
                  cy={y(value)}
                  r="2.4"
                  fill="none"
                  stroke={INK.muted}
                  strokeWidth="1.2"
                />
              ))}

              {/* An invisible slab makes the whole column hoverable, including
                  the empty space beside a short box. */}
              <rect
                x={band.at(index)}
                y={pad.top}
                width={band.bandWidth}
                height={plotH}
                fill="transparent"
              />
            </g>
          )
        })}

        <XAxis
          labels={groups.map((g) => g.label)}
          band={band}
          y={pad.top + plotH + (rotateLabels ? 18 : 20)}
          rotate={rotateLabels}
        />

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
      </svg>

      <Tooltip tip={tip} width={width} />
    </div>
  )
}

const round = (value) => Math.round(value * 10) / 10
