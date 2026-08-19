/**
 * Shared plumbing for the hand-built SVG charts.
 *
 * These charts are drawn by hand rather than pulled from a charting library on
 * purpose: the project already had its dependencies installed and frozen, and
 * adding one mid-hackathon means every teammate has to re-run npm install
 * before the app boots again. Plain SVG costs a little more code and no setup.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { INK } from '@/features/dashboard/theme'

/* Measures the container so charts fill whatever width the grid gives them.
   Height stays fixed by the caller — the grid rows are uniform. */
export function useChartWidth(fallback = 520) {
  const ref = useRef(null)
  const [width, setWidth] = useState(fallback)

  useEffect(() => {
    const node = ref.current
    if (!node || typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(([entry]) => {
      const next = entry.contentRect.width
      if (next > 0) setWidth(next)
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return [ref, width]
}

/**
 * Tooltip state for a chart. Kept here so every chart opens and closes its
 * tooltip the same way, and so keyboard focus can reuse the mouse path.
 */
export function useTooltip() {
  const [tip, setTip] = useState(null)
  const show = useCallback((x, y, content) => setTip({ x, y, content }), [])
  const hide = useCallback(() => setTip(null), [])
  return { tip, show, hide }
}

/** Renders the floating tooltip. Positioned against the chart's own box. */
export function Tooltip({ tip, width }) {
  if (!tip) return null

  // Flip to the left of the cursor near the right edge so it never clips out.
  const flip = tip.x > width - 150
  const style = {
    left: flip ? tip.x - 12 : tip.x + 12,
    top: tip.y,
    transform: flip ? 'translate(-100%, -50%)' : 'translateY(-50%)',
  }

  return (
    <div className="dsh-tooltip" style={style} role="status">
      {tip.content}
    </div>
  )
}

/**
 * The interaction props every hoverable mark carries.
 *
 * Three input methods, one code path:
 *   - mouse   — the tooltip follows the pointer's y
 *   - touch   — onMouseMove never fires on a tablet, so touch is handled
 *               explicitly; without this the tooltips are simply missing on
 *               any device without a mouse
 *   - keyboard— focus shows the same tooltip, and the aria-label carries the
 *               same numbers for a screen reader
 *
 * `label` is not optional: it is the only way the value reaches someone who
 * cannot see the mark.
 */
export function hitProps({ show, hide, x, y, content, label }) {
  const anchorY = (event) => {
    const svg = event.currentTarget.ownerSVGElement || event.currentTarget
    const box = svg.getBoundingClientRect()
    const point = event.touches?.[0] ?? event
    return typeof point.clientY === 'number' ? point.clientY - box.top : y
  }

  return {
    tabIndex: 0,
    role: 'img',
    'aria-label': label,
    onMouseMove: (event) => show(x, anchorY(event), content),
    onTouchStart: (event) => show(x, anchorY(event), content),
    onFocus: () => show(x, y, content),
    onBlur: hide,
  }
}

/**
 * Props for the plot container.
 *
 * The touch handler runs in the capture phase — on the way *down* to the mark —
 * so a tap first clears the old tooltip and the mark then draws its own. Tapping
 * empty space inside the plot only clears. Without capture the order reverses
 * and every tap would close the tooltip it just opened.
 */
export function plotProps(hide) {
  return {
    className: 'dsh-plot',
    onMouseLeave: hide,
    onTouchStartCapture: hide,
  }
}

/** Linear scale factory — the only scale these charts need. */
export function scaleLinear(domain, range) {
  const [d0, d1] = domain
  const [r0, r1] = range
  const span = d1 - d0 || 1
  return (value) => r0 + ((value - d0) / span) * (r1 - r0)
}

/** Evenly spaced band positions, e.g. one slot per category. */
export function scaleBand(count, range, paddingRatio = 0.28) {
  const [r0, r1] = range
  const total = r1 - r0
  const step = total / (count || 1)
  const bandWidth = step * (1 - paddingRatio)
  return {
    step,
    bandWidth,
    at: (index) => r0 + index * step + (step - bandWidth) / 2,
  }
}

/** Round tick values for an axis — 0, 0.25, 0.5 … rather than 0.6187. */
export function ticks(min, max, count = 4) {
  const out = []
  for (let i = 0; i <= count; i += 1) {
    out.push(min + ((max - min) * i) / count)
  }
  return out
}

/** Horizontal gridlines plus the y-axis labels that go with them. */
export function YAxis({ scale, values, format, left, right }) {
  return (
    <g aria-hidden="true">
      {values.map((value) => {
        const y = scale(value)
        return (
          <g key={value}>
            <line
              x1={left}
              x2={right}
              y1={y}
              y2={y}
              stroke={INK.grid}
              strokeWidth="1"
              shapeRendering="crispEdges"
            />
            <text x={left - 10} y={y + 4} textAnchor="end" className="dsh-axis-text">
              {format(value)}
            </text>
          </g>
        )
      })}
    </g>
  )
}

/** Category labels under the plot. */
export function XAxis({ labels, band, y, rotate = false }) {
  return (
    <g aria-hidden="true">
      {labels.map((label, index) => {
        const x = band.at(index) + band.bandWidth / 2
        return (
          <text
            key={label}
            x={x}
            y={y}
            textAnchor={rotate ? 'end' : 'middle'}
            transform={rotate ? `rotate(-24 ${x} ${y})` : undefined}
            className="dsh-axis-text"
          >
            {label}
          </text>
        )
      })}
    </g>
  )
}

/** A rectangle with only its two far-end corners rounded (the data end). */
export function roundedTopRect(x, y, width, height, radius = 4) {
  const r = Math.min(radius, width / 2, Math.max(height, 0))
  if (height <= 0) return ''
  return [
    `M${x},${y + height}`,
    `L${x},${y + r}`,
    `Q${x},${y} ${x + r},${y}`,
    `L${x + width - r},${y}`,
    `Q${x + width},${y} ${x + width},${y + r}`,
    `L${x + width},${y + height}`,
    'Z',
  ].join(' ')
}

/** Same idea, grown rightwards from a left baseline. */
export function roundedRightRect(x, y, width, height, radius = 4) {
  const r = Math.min(radius, height / 2, Math.max(width, 0))
  if (width <= 0) return ''
  return [
    `M${x},${y}`,
    `L${x + width - r},${y}`,
    `Q${x + width},${y} ${x + width},${y + r}`,
    `L${x + width},${y + height - r}`,
    `Q${x + width},${y + height} ${x + width - r},${y + height}`,
    `L${x},${y + height}`,
    'Z',
  ].join(' ')
}

export const pct = (value, digits = 0) => `${(value * 100).toFixed(digits)}%`
