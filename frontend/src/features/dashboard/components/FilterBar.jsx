import { RotateCcw } from 'lucide-react'

import {
  AGE_RANGE,
  CHIP_FILTERS,
  EDSS_RANGE,
  EMPTY_FILTERS,
  isPristine,
  toggleChip,
} from '@/features/dashboard/data/cohort'

/**
 * The control surface for the whole Cohort section.
 *
 * It sits above the panels rather than inside any one of them for the same
 * reason the run picker sits in the top bar: it re-scopes every figure below
 * it at once, and a filter that lived in a card would let two panels disagree
 * about which patients they are describing.
 *
 * Nothing here is a submit button. Each control writes straight to the filter
 * state and the section recomputes — with a thousand rows held in memory the
 * whole recalculation lands in the same frame, so an Apply step would only add
 * a click and the doubt that comes with one.
 */
export default function FilterBar({ filters, onChange, matched, total }) {
  const pristine = isPristine(filters)
  const share = total ? Math.round((matched / total) * 100) : 0

  return (
    <div className="dsh-filters">
      <div className="dsh-filters-head">
        <div>
          <p className="dsh-filters-count">
            <strong>{matched.toLocaleString()}</strong> of {total.toLocaleString()} patients
            {!pristine && <span className="dsh-filters-share"> · {share}% of the cohort</span>}
          </p>
          <p className="dsh-filters-note">
            {pristine
              ? 'Every panel below describes the full cohort. Narrow it and they all follow.'
              : 'Every panel below is recomputed from this selection.'}
          </p>
        </div>

        {!pristine && (
          <button
            type="button"
            className="dsh-ghost-btn"
            onClick={() => onChange(EMPTY_FILTERS)}
          >
            <RotateCcw size={15} />
            Reset filters
          </button>
        )}
      </div>

      <div className="dsh-filter-groups">
        {CHIP_FILTERS.map((group) => (
          <fieldset key={group.id} className="dsh-filter-group">
            <legend className="dsh-filter-legend">{group.label}</legend>
            <div className="dsh-chips">
              {group.options.map((option) => {
                const on = filters[group.id].includes(option.value)
                return (
                  <button
                    key={String(option.value)}
                    type="button"
                    title={option.title}
                    className={`dsh-chip${on ? ' is-on' : ''}`}
                    aria-pressed={on}
                    onClick={() => onChange(toggleChip(filters, group.id, option.value))}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </fieldset>
        ))}

        <RangeFilter
          label="EDSS"
          bounds={EDSS_RANGE}
          step={0.5}
          value={filters.edss}
          format={(v) => v.toFixed(1)}
          onChange={(edss) => onChange({ ...filters, edss })}
        />

        <RangeFilter
          label="Age at diagnosis"
          bounds={AGE_RANGE}
          step={1}
          value={filters.age}
          format={(v) => `${v}`}
          onChange={(age) => onChange({ ...filters, age })}
        />
      </div>
    </div>
  )
}

/**
 * Two range inputs stacked into one track.
 *
 * They are real <input type="range"> elements rather than a mouse-driven
 * custom control so that both handles stay keyboard-operable and announce
 * their value; the styling is only what makes the two share a track. Each
 * handle is clamped against the other so the pair can never cross and invert
 * the window.
 */
function RangeFilter({ label, bounds, step, value, format, onChange }) {
  const [min, max] = bounds
  const [low, high] = value
  const span = max - min

  const leftPct = ((low - min) / span) * 100
  const rightPct = ((high - min) / span) * 100

  return (
    <fieldset className="dsh-filter-group dsh-filter-group--range">
      <legend className="dsh-filter-legend">
        {label}
        <span className="dsh-filter-value">
          {format(low)} – {format(high)}
        </span>
      </legend>

      <div className="dsh-range">
        <span className="dsh-range-track" aria-hidden="true" />
        <span
          className="dsh-range-fill"
          style={{ left: `${leftPct}%`, right: `${100 - rightPct}%` }}
          aria-hidden="true"
        />

        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={low}
          aria-label={`${label}, lowest included`}
          onChange={(event) => onChange([Math.min(Number(event.target.value), high), high])}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={high}
          aria-label={`${label}, highest included`}
          onChange={(event) => onChange([low, Math.max(Number(event.target.value), low)])}
        />
      </div>
    </fieldset>
  )
}
