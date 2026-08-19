import { useEffect, useMemo, useState } from 'react'

import {
  BECK_CATEGORIES,
  EDSS_GROUPS,
  EDSS_RANGE,
  EMPTY_FILTERS,
  loadCohort,
  toggleChip,
} from '@/features/dashboard/data/cohort'
import {
  applyFilters,
  beckByDuration,
  beckByEdssGroup,
  beckByPhenotype,
  beckCategoryMix,
  correlationByPhenotype,
  edssBeckScatter,
  histogram,
  severityCrosstab,
  summarise,
} from '@/features/dashboard/data/cohortStats'

import { RAMP, SERIES } from '@/features/dashboard/theme'
import ChartCard from '@/features/dashboard/charts/ChartCard'
import LineChart from '@/features/dashboard/charts/LineChart'
import Donut from '@/features/dashboard/charts/Donut'
import { HorizontalBars } from '@/features/dashboard/charts/BarChart'
import Scatter from '@/features/dashboard/charts/Scatter'
import BoxPlot from '@/features/dashboard/charts/BoxPlot'
import Heatmap from '@/features/dashboard/charts/Heatmap'
import Histogram from '@/features/dashboard/charts/Histogram'
import KpiTile from '@/features/dashboard/components/KpiTile'
import FilterBar from '@/features/dashboard/components/FilterBar'

/**
 * The clinical evidence behind the assistant: 1011 multiple-sclerosis patients
 * scored on both the EDSS and the Beck Depression Inventory.
 *
 * The rest of the dashboard measures how well the system retrieves and cites.
 * This section is the other half of the claim — that the relationship it is
 * being asked about is real in patient data, and how strongly. Every panel is
 * driven by the same filter state, so a question like "does this hold for
 * untreated primary-progressive patients?" is answered by clicking, not by
 * regenerating a chart.
 */
export default function CohortSection() {
  const [state, setState] = useState({ status: 'loading', records: [], source: null })
  const [filters, setFilters] = useState(EMPTY_FILTERS)

  useEffect(() => {
    let live = true

    loadCohort()
      .then(({ records, source }) => {
        if (live) setState({ status: 'ready', records, source })
      })
      .catch((error) => {
        if (live) setState({ status: 'error', records: [], source: null, error })
      })

    return () => {
      live = false
    }
  }, [])

  const { records } = state

  const selection = useMemo(() => applyFilters(records, filters), [records, filters])

  /* The two panels that filter *by* a band are computed with that band's own
     filter lifted, so clicking "Severe" narrows the rest of the section
     without collapsing the very chart the click came from into a single
     column. Every other panel sees the full filter. */
  const acrossEdss = useMemo(
    () => applyFilters(records, { ...filters, edss: EDSS_RANGE }),
    [records, filters]
  )
  const acrossPhenotypes = useMemo(
    () => applyFilters(records, { ...filters, phenotype: [] }),
    [records, filters]
  )

  const stats = useMemo(() => summarise(selection), [selection])
  const whole = useMemo(() => summarise(records), [records])

  if (state.status === 'loading') {
    return (
      <Section>
        <p className="dsh-cohort-status">Loading the patient cohort…</p>
      </Section>
    )
  }

  if (state.status === 'error') {
    return (
      <Section>
        <p className="dsh-cohort-status dsh-cohort-status--error">
          The cohort file could not be loaded. It is served from
          <code> public/data/cohort.json</code> — the dev server has to be running for
          the browser to reach it.
        </p>
      </Section>
    )
  }

  const selectedBand =
    EDSS_GROUPS.find(
      (g) => filters.edss[0] === g.range[0] && filters.edss[1] === g.range[1]
    )?.id ?? null

  const pickBand = (id) => {
    const group = EDSS_GROUPS.find((g) => g.id === id)
    setFilters({ ...filters, edss: selectedBand === id ? EDSS_RANGE : group.range })
  }

  const pickPhenotype = (id) => setFilters(toggleChip(filters, 'phenotype', id))
  const selectedPhenotype = filters.phenotype.length === 1 ? filters.phenotype[0] : null

  return (
    <Section source={state.source}>
      <FilterBar
        filters={filters}
        onChange={setFilters}
        matched={selection.length}
        total={records.length}
      />

      {selection.length < 12 ? (
        <p className="dsh-cohort-status">
          {selection.length === 0
            ? 'No patient matches this combination of filters.'
            : `Only ${selection.length} patients match — too few to summarise. Widen the selection.`}
        </p>
      ) : (
        <>
          <Headline stats={stats} whole={whole} filtered={selection.length !== records.length} />

          <div className="dsh-grid">
            <Relationship records={selection} stats={stats} />

            <ChartCard
              title="Depression mix within each disability band"
              subtitle="Each row is 100% of that band. Click a row to hold the section to it."
              footnote="Beck bands are the BDI manual's cut points: 0–13 minimal, 14–19 mild, 20–28 moderate, 29+ severe."
              table={{
                columns: ['Disability band', ...BECK_CATEGORIES.map((c) => c.label), 'Patients'],
                rows: severityCrosstab(acrossEdss).map((row) => [
                  row.label,
                  ...row.cells.map((cell) => pct(cell.value)),
                  String(row.total),
                ]),
              }}
            >
              <Heatmap
                rows={severityCrosstab(acrossEdss)}
                columns={BECK_CATEGORIES}
                onPick={pickBand}
                selectedRow={selectedBand}
              />
            </ChartCard>

            <ChartCard
              title="Beck score by disability band"
              subtitle="Median and middle half per band. Click a box to hold the section to it."
              footnote="Whiskers reach 1.5×IQR; the rings beyond them are individual patients."
              table={{
                columns: ['Band', 'Patients', 'Median', 'Q1', 'Q3', 'Mean'],
                rows: beckByEdssGroup(acrossEdss).map((g) => [
                  g.label,
                  String(g.n),
                  one(g.median),
                  one(g.q1),
                  one(g.q3),
                  one(g.mean),
                ]),
              }}
            >
              <BoxPlot
                groups={beckByEdssGroup(acrossEdss)}
                yLabel="Beck total"
                onPick={pickBand}
                selected={selectedBand}
              />
            </ChartCard>

            <ChartCard
              title="Beck score by MS phenotype"
              subtitle="Secondary-progressive patients carry the heaviest scores. Click a box to filter."
              table={{
                columns: ['Phenotype', 'Patients', 'Median', 'Q1', 'Q3'],
                rows: beckByPhenotype(acrossPhenotypes).map((g) => [
                  `${g.label} — ${g.title}`,
                  String(g.n),
                  one(g.median),
                  one(g.q1),
                  one(g.q3),
                ]),
              }}
            >
              <BoxPlot
                groups={beckByPhenotype(acrossPhenotypes)}
                yLabel="Beck total"
                onPick={pickPhenotype}
                selected={selectedPhenotype}
              />
            </ChartCard>

            <ChartCard
              title="Correlation strength by phenotype"
              subtitle="The same rank correlation, computed inside each phenotype."
              footnote="Groups under 30 patients are marked — a coefficient on that few patients is not yet a finding."
              table={{
                columns: ['Phenotype', 'Spearman r', 'Patients', 'p'],
                rows: correlationByPhenotype(acrossPhenotypes).map((row) => [
                  row.name + (row.thin ? ' (small group)' : ''),
                  row.value.toFixed(2),
                  String(row.n),
                  formatP(row.p),
                ]),
              }}
            >
              <HorizontalBars
                items={correlationByPhenotype(acrossPhenotypes).map((row) => ({
                  name: row.thin ? `${row.name} · n=${row.n}` : row.name,
                  value: Math.max(row.value, 0),
                }))}
                formatValue={(v) => v.toFixed(2)}
                height={190}
              />
            </ChartCard>

            <ChartCard
              title="Depression against time since diagnosis"
              subtitle="Mean Beck total in five-year bands of disease duration."
              footnote="Bands holding fewer than ten patients are left out rather than drawn on thin evidence."
              table={{
                columns: ['Years since diagnosis', 'Mean Beck', 'Patients'],
                rows: beckByDuration(selection).map((b) => [b.label, one(b.value), String(b.n)]),
              }}
            >
              <DurationTrend records={selection} />
            </ChartCard>

            <ChartCard
              title="Depression severity mix"
              subtitle="How the current selection splits across the four Beck categories."
              table={{
                columns: ['Category', 'Beck range', 'Patients', 'Share'],
                rows: (() => {
                  const mix = beckCategoryMix(selection)
                  const total = mix.reduce((sum, m) => sum + m.value, 0) || 1
                  return mix.map((m) => [
                    m.label,
                    m.range,
                    String(m.value),
                    pct(m.value / total),
                  ])
                })(),
              }}
            >
              <Donut
                segments={beckCategoryMix(selection)}
                colors={RAMP}
                centerLabel="patients"
              />
            </ChartCard>

            <ChartCard
              title="Age at diagnosis"
              subtitle="Who the selection is, before any of the scores are read."
              table={{
                columns: ['Age band', 'Patients'],
                rows: histogram(selection, 'ageDiagnosis', { min: 5, max: 75, binWidth: 5 }).map(
                  (bin) => [`${bin.start}–${bin.end - 1}`, String(bin.value)]
                ),
              }}
            >
              <Histogram
                bins={histogram(selection, 'ageDiagnosis', { min: 5, max: 75, binWidth: 5 })}
                xLabel="Age at diagnosis (years)"
              />
            </ChartCard>
          </div>
        </>
      )}
    </Section>
  )
}

/* --- panels --------------------------------------------------------------- */

function Headline({ stats, whole, filtered }) {
  // Against the whole cohort, so a filter immediately says how this group
  // differs from every patient in the file rather than from nothing.
  const delta = (a, b) => (filtered ? a - b : 0)

  return (
    <div className="dsh-kpi-grid">
      <KpiTile
        hero
        label="Clinically relevant depression"
        value={stats.depressionRate}
        format={(v) => pct(v)}
        delta={delta(stats.depressionRate, whole.depressionRate)}
        deltaLabel="vs whole cohort"
        caption={`Beck total of 20 or more — moderate and severe combined. ${stats.scored} patients scored.`}
      />

      <KpiTile
        label="Mean Beck total"
        value={stats.meanBeck}
        format={(v) => v.toFixed(1)}
        delta={delta(stats.meanBeck, whole.meanBeck)}
        deltaLabel="vs whole cohort"
        lowerIsBetter
        caption="Beck Depression Inventory, 0–63."
      />

      <KpiTile
        label="Mean EDSS"
        value={stats.meanEdss}
        format={(v) => v.toFixed(1)}
        delta={delta(stats.meanEdss, whole.meanEdss)}
        deltaLabel="vs whole cohort"
        lowerIsBetter
        caption="Expanded Disability Status Scale, 0–10."
      />

      <KpiTile
        label="EDSS ↔ Beck correlation"
        value={stats.correlation.r}
        format={(v) => v.toFixed(2)}
        delta={delta(stats.correlation.r, whole.correlation.r)}
        deltaLabel="vs whole cohort"
        caption={`Spearman rank correlation, ${formatP(stats.correlation.p)}, n=${stats.correlation.n}.`}
      />
    </div>
  )
}

function Relationship({ records, stats }) {
  const { points, trend } = edssBeckScatter(records)

  return (
    <ChartCard
      span={2}
      title="Disability against depression"
      subtitle={`Spearman r = ${stats.correlation.r.toFixed(2)} (${formatP(stats.correlation.p)}, n = ${stats.correlation.n}) — depression rises with disability, but not tightly.`}
      legend={[
        { label: 'Patients at that score', color: SERIES[0] },
        { label: 'Median Beck at each EDSS step', color: SERIES[1], shape: 'line' },
      ]}
      footnote="A circle covers every patient sharing that exact pair of scores; its area is how many. r describes the trend's direction and consistency, not how much of the score it explains."
      table={{
        columns: ['EDSS', 'Median Beck', 'Patients at this step'],
        rows: trend.map((point) => [point.x.toFixed(1), one(point.y), String(point.n)]),
      }}
    >
      <Scatter
        points={points}
        trend={trend}
        xLabel="EDSS (disability)"
        yLabel="Beck total"
        height={330}
      />
    </ChartCard>
  )
}

function DurationTrend({ records }) {
  const bands = beckByDuration(records)

  if (bands.length < 2) {
    return <p className="dsh-cohort-status">Not enough patients per duration band to plot.</p>
  }

  return (
    <LineChart
      series={[{ label: 'Mean Beck', points: bands.map((b) => ({ x: b.x, y: b.value })) }]}
      height={230}
      yDomain={[0, 30]}
      formatY={(v) => Math.round(v)}
      formatX={(v) => bands.find((b) => b.x === v)?.label ?? v}
      formatValue={(v) => v.toFixed(1)}
      xLabel="Years since diagnosis"
      labelLast={false}
    />
  )
}

function Section({ children, source }) {
  return (
    <section id="dsh-cohort" className="dsh-section">
      <div className="dsh-section-head">
        <p className="dsh-eyebrow">Cohort</p>
        <h2 className="dsh-section-title">The patient evidence</h2>
        <p className="dsh-section-note">
          {source
            ? `${source.patients.toLocaleString()} multiple-sclerosis patients · ${source.citation}`
            : 'Multiple-sclerosis patients scored on the EDSS and the Beck Depression Inventory.'}
        </p>
      </div>

      {children}
    </section>
  )
}

/* --- formatting ----------------------------------------------------------- */

const pct = (value, digits = 0) => `${(value * 100).toFixed(digits)}%`
const one = (value) => value.toFixed(1)

/** p-values here reach 1e-40, so past three zeros they are written as a bound. */
function formatP(p) {
  if (p >= 0.001) return `p = ${p.toFixed(3)}`
  if (p === 0) return 'p < 1e-300'
  return `p ≈ ${p.toExponential(0)}`
}
