/**
 * The patient cohort behind the Cohort section.
 *
 * 1011 multiple-sclerosis patients scored on the Beck Depression Inventory and
 * the Expanded Disability Status Scale (PLOS ONE 10.1371/journal.pone.0160261,
 * supporting information S1). The spreadsheet was converted to
 * public/data/cohort.json once; the "#NULL!" strings it used for missing
 * values are null here, so every consumer only has to check for null.
 *
 * The whole file is 1011 rows — small enough to hold in memory and filter in
 * the browser, which is what lets every panel re-compute on the same frame a
 * filter chip is clicked. Pointing loadCohort() at a Flask endpoint later means
 * changing the URL below and nothing else.
 */

const SOURCE_URL = '/data/cohort.json'

/* --- Clinical banding -----------------------------------------------------
   Both scales are cut at their published thresholds, not at quantiles of this
   sample: EDSS at the usual mild / moderate / severe disability bands, and the
   Beck total at the BDI manual's 0-13 / 14-19 / 20-28 / 29+ cut points. Using
   the published cuts is what makes a number here comparable to a number in the
   paper. */

/* `range` is the same band expressed as the slider window it corresponds to,
   which is what lets a click on a band in a chart write itself into the very
   same filter state the slider uses, instead of a second parallel one. */
export const EDSS_GROUPS = [
  { id: 'mild', label: 'Mild (0–3)', match: (v) => v <= 3, range: [0, 3] },
  { id: 'moderate', label: 'Moderate (3.5–6)', match: (v) => v > 3 && v <= 6, range: [3.5, 6] },
  { id: 'severe', label: 'Severe (6.5+)', match: (v) => v > 6, range: [6.5, 9.5] },
]

export const BECK_CATEGORIES = [
  { id: 'minimal', label: 'Minimal', range: '0–13', max: 13 },
  { id: 'mild', label: 'Mild', range: '14–19', max: 19 },
  { id: 'moderate', label: 'Moderate', range: '20–28', max: 28 },
  { id: 'severe', label: 'Severe', range: '29+', max: Infinity },
]

/** Moderate and above is the line the section treats as "clinically relevant". */
export const DEPRESSED_FROM = 20

export const PHENOTYPES = [
  { id: 'RR', label: 'RR', title: 'Relapsing–remitting' },
  { id: 'SP', label: 'SP', title: 'Secondary progressive' },
  { id: 'PP', label: 'PP', title: 'Primary progressive' },
  { id: 'CIS', label: 'CIS', title: 'Clinically isolated syndrome' },
]

export function edssGroupOf(edss) {
  if (edss == null) return null
  return EDSS_GROUPS.find((g) => g.match(edss))?.id ?? null
}

export function beckCategoryOf(beck) {
  if (beck == null) return null
  return BECK_CATEGORIES.find((c) => beck <= c.max)?.id ?? null
}

/** Fetches the cohort once and hangs the two derived bands off every record. */
export async function loadCohort() {
  const response = await fetch(SOURCE_URL)
  if (!response.ok) {
    throw new Error(`Could not load the cohort (${response.status})`)
  }

  const payload = await response.json()

  const records = payload.records.map((r) => ({
    ...r,
    edssGroup: edssGroupOf(r.edss),
    beckCategory: beckCategoryOf(r.beck),
  }))

  return { source: payload.source, records }
}

/* --- Filters --------------------------------------------------------------
   One shape for the whole section. An empty array means "no restriction"
   rather than "nothing selected", so a fresh filter state and a cleared one
   are the same object and no panel has to special-case the initial render. */

export const EDSS_RANGE = [0, 9.5]
export const AGE_RANGE = [9, 70]

export const EMPTY_FILTERS = {
  gender: [],
  phenotype: [],
  treated: [],
  education: [],
  edss: EDSS_RANGE,
  age: AGE_RANGE,
}

/** The categorical chip groups, in the order they appear in the filter bar. */
export const CHIP_FILTERS = [
  {
    id: 'gender',
    label: 'Gender',
    options: [
      { value: 'F', label: 'Female' },
      { value: 'M', label: 'Male' },
    ],
  },
  {
    id: 'phenotype',
    label: 'MS phenotype',
    options: PHENOTYPES.map((p) => ({ value: p.id, label: p.label, title: p.title })),
  },
  {
    id: 'treated',
    label: 'Disease-modifying treatment',
    options: [
      { value: true, label: 'On treatment' },
      { value: false, label: 'Untreated' },
    ],
  },
  {
    id: 'education',
    label: 'Education',
    options: [
      { value: 'Primary school', label: 'Primary' },
      { value: 'Secondary school of first degree', label: 'Secondary I' },
      { value: 'Secondary school of second degree', label: 'Secondary II' },
      { value: 'Degree', label: 'Degree' },
    ],
  },
]

/** True when the filters are untouched — used to hide the reset button. */
export function isPristine(filters) {
  return (
    CHIP_FILTERS.every((f) => filters[f.id].length === 0) &&
    filters.edss[0] === EDSS_RANGE[0] &&
    filters.edss[1] === EDSS_RANGE[1] &&
    filters.age[0] === AGE_RANGE[0] &&
    filters.age[1] === AGE_RANGE[1]
  )
}

/** Adds a value to a chip group, or removes it when it is already on. */
export function toggleChip(filters, id, value) {
  const current = filters[id]
  const next = current.includes(value)
    ? current.filter((v) => v !== value)
    : [...current, value]
  return { ...filters, [id]: next }
}
