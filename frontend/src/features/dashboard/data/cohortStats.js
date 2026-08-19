/**
 * Every number the Cohort section shows is computed here, from the filtered
 * record list and nothing else.
 *
 * Keeping the maths in one file away from the components is what makes the
 * cross-filtering honest: a chip click changes the record list, the whole set
 * of statistics is recomputed from that list, and no panel can be left showing
 * a figure from the previous selection.
 *
 * Records carrying null in a field are dropped by the statistic that needs
 * that field, not by the filter — so a patient missing an EDSS still counts
 * toward the age histogram.
 */

import {
  BECK_CATEGORIES,
  DEPRESSED_FROM,
  EDSS_GROUPS,
  PHENOTYPES,
} from '@/features/dashboard/data/cohort'

/* --- filtering ----------------------------------------------------------- */

export function applyFilters(records, filters) {
  return records.filter((r) => {
    if (filters.gender.length && !filters.gender.includes(r.gender)) return false
    if (filters.phenotype.length && !filters.phenotype.includes(r.phenotype)) return false
    if (filters.treated.length && !filters.treated.includes(r.treated)) return false
    if (filters.education.length && !filters.education.includes(r.education)) return false

    // A patient with no EDSS cannot be shown to sit inside an EDSS window, so
    // narrowing the slider excludes them. At the full range they stay in.
    const [e0, e1] = filters.edss
    if (r.edss == null ? e0 > 0 || e1 < 9.5 : r.edss < e0 || r.edss > e1) return false

    const [a0, a1] = filters.age
    if (r.ageDiagnosis == null ? a0 > 9 || a1 < 70 : r.ageDiagnosis < a0 || r.ageDiagnosis > a1)
      return false

    return true
  })
}

/* --- small statistics ---------------------------------------------------- */

const numbers = (records, key) =>
  records.map((r) => r[key]).filter((v) => v != null && !Number.isNaN(v))

export const mean = (values) =>
  values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : 0

/** Linear-interpolated quantile on an already-sorted array. */
export function quantile(sorted, q) {
  if (!sorted.length) return 0
  const pos = (sorted.length - 1) * q
  const base = Math.floor(pos)
  const rest = pos - base
  const next = sorted[base + 1]
  return next === undefined ? sorted[base] : sorted[base] + rest * (next - sorted[base])
}

/** Average ranks, so tied values share a rank — required for Spearman. */
function rank(values) {
  const order = values
    .map((value, index) => ({ value, index }))
    .sort((a, b) => a.value - b.value)

  const ranks = new Array(values.length)
  let i = 0
  while (i < order.length) {
    let j = i
    while (j + 1 < order.length && order[j + 1].value === order[i].value) j += 1
    const shared = (i + j) / 2 + 1
    for (let k = i; k <= j; k += 1) ranks[order[k].index] = shared
    i = j + 1
  }
  return ranks
}

/* --- the t distribution -------------------------------------------------- */

/**
 * Two-sided p for a t statistic, through the regularised incomplete beta.
 *
 * The obvious shortcut — a normal approximation on the Fisher z transform —
 * is out by more than an order of magnitude this far into the tail (it puts
 * the headline correlation at 4e-40 where the exact figure is 3e-41), and a
 * p-value printed on a dashboard should not be a different number from the one
 * the analysis script reports. The exact tail costs about thirty lines.
 */
function tTailTwoSided(t, df) {
  const x = df / (df + t * t)
  return incompleteBeta(df / 2, 0.5, x)
}

/** Lanczos approximation — accurate to ~15 digits over the range used here. */
function logGamma(z) {
  const c = [
    76.18009172947146, -86.50532032941677, 24.01409824083091,
    -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5,
  ]
  let y = z
  let tmp = z + 5.5
  tmp -= (z + 0.5) * Math.log(tmp)
  let series = 1.000000000190015
  for (let j = 0; j < 6; j += 1) {
    y += 1
    series += c[j] / y
  }
  return -tmp + Math.log((2.5066282746310005 * series) / z)
}

/** Regularised incomplete beta I_x(a, b), by continued fraction. */
function incompleteBeta(a, b, x) {
  if (x <= 0) return 0
  if (x >= 1) return 1

  const front =
    Math.exp(
      logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x)
    ) / a

  // The fraction only converges quickly on one side of the distribution, so
  // the far side is reached through the symmetry I_x(a,b) = 1 - I_1-x(b,a).
  if (x >= (a + 1) / (a + b + 2)) {
    return 1 - incompleteBeta(b, a, 1 - x)
  }

  const tiny = 1e-30
  let f = 1
  let c = 1
  let d = 0

  for (let i = 0; i <= 300; i += 1) {
    const m = Math.floor(i / 2)
    let numerator
    if (i === 0) numerator = 1
    else if (i % 2 === 0) numerator = (m * (b - m) * x) / ((a + 2 * m - 1) * (a + 2 * m))
    else numerator = -(((a + m) * (a + b + m) * x) / ((a + 2 * m) * (a + 2 * m + 1)))

    d = 1 + numerator * d
    if (Math.abs(d) < tiny) d = tiny
    d = 1 / d

    c = 1 + numerator / c
    if (Math.abs(c) < tiny) c = tiny

    const step = c * d
    f *= step

    if (Math.abs(1 - step) < 1e-12) break
  }

  return front * (f - 1)
}

/**
 * Spearman rank correlation with a two-sided p-value.
 *
 * EDSS is an ordinal scale with a heap of patients on every half step and the
 * Beck total is bounded and skewed, so Pearson's r would be the wrong
 * coefficient for this pair — the monotone rank version is what the source
 * paper reports as well. Significance is the usual t test on the coefficient,
 * carried out exactly rather than through a normal approximation, because the
 * tail here is far past where that approximation still holds.
 */
export function spearman(records, xKey = 'edss', yKey = 'beck') {
  const pairs = records.filter((r) => r[xKey] != null && r[yKey] != null)
  const n = pairs.length
  if (n < 4) return { r: 0, n, p: 1 }

  const rx = rank(pairs.map((r) => r[xKey]))
  const ry = rank(pairs.map((r) => r[yKey]))
  const mx = mean(rx)
  const my = mean(ry)

  let covariance = 0
  let varX = 0
  let varY = 0
  for (let i = 0; i < n; i += 1) {
    const a = rx[i] - mx
    const b = ry[i] - my
    covariance += a * b
    varX += a * a
    varY += b * b
  }

  const r = varX && varY ? covariance / Math.sqrt(varX * varY) : 0

  const clamped = Math.min(Math.abs(r), 0.999999999)
  const t = clamped * Math.sqrt((n - 2) / (1 - clamped * clamped))

  return { r, n, p: Math.min(1, tTailTwoSided(t, n - 2)) }
}

/** Whiskers at 1.5 IQR; everything past them is drawn as its own point. */
export function boxStats(values) {
  const sorted = [...values].sort((a, b) => a - b)
  if (!sorted.length) {
    return { n: 0, min: 0, q1: 0, median: 0, q3: 0, max: 0, mean: 0, outliers: [] }
  }

  const q1 = quantile(sorted, 0.25)
  const median = quantile(sorted, 0.5)
  const q3 = quantile(sorted, 0.75)
  const fence = 1.5 * (q3 - q1)

  const inside = sorted.filter((v) => v >= q1 - fence && v <= q3 + fence)

  return {
    n: sorted.length,
    q1,
    median,
    q3,
    mean: mean(sorted),
    min: inside.length ? inside[0] : sorted[0],
    max: inside.length ? inside[inside.length - 1] : sorted[sorted.length - 1],
    outliers: sorted.filter((v) => v < q1 - fence || v > q3 + fence),
  }
}

/* --- the section's panels ------------------------------------------------ */

/** Headline figures. Every one of them moves with the filters. */
export function summarise(records) {
  const beck = numbers(records, 'beck')
  const edss = numbers(records, 'edss')

  return {
    patients: records.length,
    scored: beck.length,
    meanBeck: mean(beck),
    meanEdss: mean(edss),
    depressionRate: beck.length
      ? beck.filter((v) => v >= DEPRESSED_FROM).length / beck.length
      : 0,
    correlation: spearman(records),
  }
}

/** Rows are EDSS bands, columns Beck categories, cells the row percentage. */
export function severityCrosstab(records) {
  return EDSS_GROUPS.map((group) => {
    const inGroup = records.filter((r) => r.edssGroup === group.id && r.beckCategory)

    return {
      id: group.id,
      label: group.label,
      total: inGroup.length,
      cells: BECK_CATEGORIES.map((category) => {
        const count = inGroup.filter((r) => r.beckCategory === category.id).length
        return {
          id: category.id,
          label: category.label,
          count,
          value: inGroup.length ? count / inGroup.length : 0,
        }
      }),
    }
  })
}

/** Beck distribution per band, in the shape the box plot wants. */
function beckByGroup(records, key, groups) {
  return groups
    .map((group) => ({
      id: group.id,
      label: group.label,
      title: group.title,
      ...boxStats(numbers(records.filter((r) => r[key] === group.id), 'beck')),
    }))
    .filter((group) => group.n > 0)
}

export const beckByEdssGroup = (records) => beckByGroup(records, 'edssGroup', EDSS_GROUPS)

export const beckByPhenotype = (records) =>
  beckByGroup(
    records,
    'phenotype',
    PHENOTYPES.map((p) => ({ id: p.id, label: p.label, title: p.title }))
  )

/**
 * The rank correlation computed separately inside each phenotype.
 *
 * Under ~30 patients the coefficient is too unstable to present as a finding,
 * so thin groups are kept but flagged rather than silently drawn at full
 * confidence next to the others.
 */
export function correlationByPhenotype(records) {
  return PHENOTYPES.map((phenotype) => {
    const subset = records.filter((r) => r.phenotype === phenotype.id)
    const { r, n, p } = spearman(subset)
    return { id: phenotype.id, name: phenotype.label, title: phenotype.title, value: r, n, p, thin: n < 30 }
  }).filter((row) => row.n > 3)
}

/** Scatter marks, plus the median Beck at each distinct EDSS step. */
export function edssBeckScatter(records) {
  const points = records
    .filter((r) => r.edss != null && r.beck != null)
    .map((r) => ({ x: r.edss, y: r.beck, record: r }))

  const steps = [...new Set(points.map((p) => p.x))].sort((a, b) => a - b)

  // A median over two patients is not a median, so a step that thin is left
  // out of the trend line rather than allowed to make it lurch.
  const trend = steps
    .map((step) => {
      const at = points
        .filter((p) => p.x === step)
        .map((p) => p.y)
        .sort((a, b) => a - b)
      return { x: step, y: quantile(at, 0.5), n: at.length }
    })
    .filter((point) => point.n >= 5)

  return { points, trend }
}

/** Equal-width bins over a numeric column. */
export function histogram(records, key, { min, max, binWidth }) {
  const count = Math.ceil((max - min) / binWidth)

  const bins = Array.from({ length: count }, (_, i) => ({
    start: min + i * binWidth,
    end: min + (i + 1) * binWidth,
    value: 0,
  }))

  numbers(records, key).forEach((value) => {
    const index = Math.min(Math.floor((value - min) / binWidth), count - 1)
    if (index >= 0) bins[index].value += 1
  })

  return bins
}

/**
 * Mean Beck against time since diagnosis, in five-year bands.
 *
 * One point per patient-year reads as noise; banding is what makes the shape
 * visible at all. Bands holding fewer than ten patients are dropped for the
 * same reason the trend line skips thin steps.
 */
export function beckByDuration(records, key = 'yearsFromDiagnosis') {
  const bands = [
    { label: '0–4', min: 0, max: 5 },
    { label: '5–9', min: 5, max: 10 },
    { label: '10–14', min: 10, max: 15 },
    { label: '15–19', min: 15, max: 20 },
    { label: '20–24', min: 20, max: 25 },
    { label: '25+', min: 25, max: Infinity },
  ]

  return bands
    .map((band, index) => {
      const inBand = records.filter(
        (r) => r[key] != null && r[key] >= band.min && r[key] < band.max
      )
      const beck = numbers(inBand, 'beck')
      return { label: band.label, x: index, value: mean(beck), n: beck.length }
    })
    .filter((band) => band.n >= 10)
}

/** Share of each Beck category across the current selection. */
export function beckCategoryMix(records) {
  return BECK_CATEGORIES.map((category) => ({
    id: category.id,
    label: category.label,
    range: category.range,
    value: records.filter((r) => r.beckCategory === category.id).length,
  }))
}
