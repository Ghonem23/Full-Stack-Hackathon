/**
 * Dashboard colour tokens.
 *
 * Every value below was checked with a colour-blindness / contrast validator
 * against a white card surface before it was written down. Do not swap a hex
 * here for "one that looks nicer" without re-validating — the categorical
 * order is what keeps the series apart for deuteranopes and protanopes.
 *
 *   categorical (adjacent pairs)  worst CVD dE 16.4 · worst normal dE 29.0
 *   ordinal blue ramp             monotone lightness, all gaps >= 0.06 L
 *
 * The first two slots are the product's own brand blue (#046DD6) and brand
 * teal (#0493AE), so the charts sit next to the sign-in screen without
 * looking like a different application.
 */

/* Categorical — identity. Assigned in fixed slot order, never cycled.
   Blue and teal are NOT safe as an all-pairs set (normal dE 13.5), so they
   are only ever used in forms where series sit adjacent: lines, grouped and
   stacked bars. No scatter plots use more than three slots. */
export const SERIES = ['#046dd6', '#eb6834', '#0493ae', '#eda100', '#4a3aa7']

/* Ordinal — ordered categories only (funnel stages, confidence tiers).
   One hue, light to dark. */
export const RAMP = ['#86b6ef', '#3987e5', '#256abf', '#184f95', '#0d366b']

/* Status — reserved. These never stand in for "series 4", and they never
   carry meaning without an icon or a written label beside them. */
export const STATUS = {
  good: '#0ca30c',
  warning: '#fab219',
  serious: '#ec835a',
  critical: '#d03b3b',
}

/* Chart chrome. Text always wears an ink token, never a series colour. */
export const INK = {
  primary: '#131116',
  secondary: '#3a373f',
  muted: '#6b6774',
  grid: '#e8edf3',
  axis: '#cbd5e1',
  surface: '#ffffff',
  plane: '#f5f8fc',
}

/* #eda100 sits at 2.17:1 on white — under the 3:1 bar. Anywhere it is used
   the chart must also carry a visible label or its table view, which the
   ChartCard table toggle guarantees for every panel. */
export const NEEDS_LABEL_RELIEF = ['#eda100']
