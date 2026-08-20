import { useEffect, useMemo, useState } from 'react'

import '@/features/dashboard/dashboard.css'

import { INK, RAMP, SERIES, STATUS } from '@/features/dashboard/theme'
import {
  DOCUMENTS,
  PIPELINE,
  RETRIEVED_CHUNKS,
  RUN_OPTIONS,
  SAMPLE_QUERY,
  DEFAULT_RUN,
  getBaselineKpi,
  loadBenchmark,
} from '@/features/dashboard/data/benchmark'
import { API_BASE_URL } from '@/config'

import ChartCard from '@/features/dashboard/charts/ChartCard'
import LineChart from '@/features/dashboard/charts/LineChart'
import Donut, { Funnel } from '@/features/dashboard/charts/Donut'
import {
  GroupedColumns,
  HorizontalBars,
  StackedBars,
  ThresholdHistogram,
} from '@/features/dashboard/charts/BarChart'

import KpiTile from '@/features/dashboard/components/KpiTile'
import LiveLatency from '@/features/dashboard/components/LiveLatency'
import EvidencePanel from '@/features/dashboard/components/EvidencePanel'
import { Sidebar, Topbar } from '@/features/dashboard/components/Shell'
import CohortSection from '@/features/dashboard/CohortSection'
import { clearSession } from '@/features/dashboard/session'

const pct = (value, digits = 0) => `${(value * 100).toFixed(digits)}%`

// Base URL configured to fallback to localhost:5000 if not specified
const API_BASE = API_BASE_URL ? API_BASE_URL.replace(/\/api$/, '') : ''

export default function DashboardPage({ onNavigate }) {
  const [runId, setRunId] = useState(DEFAULT_RUN)
  const [active, setActive] = useState('overview')

  const run = useMemo(() => loadBenchmark(runId), [runId])
  const baseline = getBaselineKpi()

  // Live traffic pulled from /api/dashboard endpoint, polled every 5 seconds
  const [live, setLive] = useState(null)

  useEffect(() => {
    let cancelled = false

    const fetchLive = async () => {
      try {
        const token = localStorage.getItem('authToken') || localStorage.getItem('token')
        const res = await fetch(`${API_BASE}/api/dashboard`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        const data = await res.json()
        if (!cancelled && data.success) {
          setLive(data)
        }
      } catch {
        // Backend not reachable — retain previous state
      }
    }

    fetchLive()
    const interval = setInterval(fetchLive, 5000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  const scrollTo = (id) => {
    setActive(id)
    document.getElementById(`dsh-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const signOut = () => {
    clearSession()
    onNavigate?.('login')
  }

  return (
    <div className="dsh-root">
      <Sidebar active={active} onNavigate={scrollTo} onOpenChat={() => onNavigate?.('chat')} />

      <div className="dsh-main">
        <Topbar
          runs={RUN_OPTIONS}
          runId={runId}
          onRunChange={setRunId}
          caption={run.caption}
          onSignOut={signOut}
        />

        <div className="dsh-scroll">
          <Overview run={run} baseline={baseline} />
          <LiveActivity live={live} />
          <CohortSection />
          <Retrieval run={run} />
          <Safety run={run} />
          <Corpus run={run} />
          <Evidence />

          <p className="dsh-disclaimer">
            Decision support only. Every answer is drawn from published guidance and
            research and is not a diagnosis. Clinical decisions stay with the
            clinician.
          </p>
        </div>
      </div>
    </div>
  )
}

/* ============================================================
   1 — Overview: Empirical evaluation headline metrics
   ============================================================ */

function Overview({ run, baseline }) {
  const { kpi, kpiTrend } = run

  return (
    <section id="dsh-overview" className="dsh-section">
      <SectionHead
        eyebrow="Overview"
        title="Headline metrics"
        note={`${PIPELINE.testCases} structured test cases · ${PIPELINE.embeddingModel} · ${PIPELINE.vectorStore}`}
      />

      <div className="dsh-kpi-grid">
        <KpiTile
          hero
          label="Retrieval Precision@5"
          value={kpi.precisionAt5}
          format={(v) => pct(v)}
          delta={kpi.precisionAt5 - baseline.precisionAt5}
          trend={kpiTrend.precisionAt5}
          caption="Relevant chunks in the top 5 ÷ 5, averaged over the test set."
        />

        <KpiTile
          label="Citation accuracy"
          value={kpi.citationAccuracy}
          format={(v) => pct(v)}
          delta={kpi.citationAccuracy - baseline.citationAccuracy}
          trend={kpiTrend.citationAccuracy}
          caption="Citations pointing at the right document, section and page."
        />

        <KpiTile
          label="Unsupported claim rate"
          value={kpi.unsupportedClaimRate}
          format={(v) => pct(v)}
          delta={kpi.unsupportedClaimRate - baseline.unsupportedClaimRate}
          lowerIsBetter
          trend={kpiTrend.unsupportedClaimRate}
          caption="Generated claims with no matching text in a retrieved chunk. Lower is better."
        />

        <KpiTile
          label="Correct refusal rate"
          value={kpi.correctRefusalRate}
          format={(v) => pct(v)}
          delta={kpi.correctRefusalRate - baseline.correctRefusalRate}
          trend={kpiTrend.correctRefusalRate}
          caption="Out-of-scope questions the system declined instead of answering."
        />
      </div>
    </section>
  )
}

/* ============================================================
   1b — Live Activity: Real chat questions via /api/dashboard
   ============================================================ */

function LiveActivity({ live }) {
  const summary = live?.summary || { totalQueries: 0, avgLatencyMs: 0, avgConfidence: 0 }
  const recentQueries = live?.recentQueries || []

  const getQualityBadgeStyle = (quality) => {
    switch (quality) {
      case 'Supported':
        return { background: '#E0F2FE', color: '#0369A1', border: '1px solid #BAE6FD' }
      case 'Unsafe':
        return { background: '#FEE2E2', color: '#B91C1C', border: '1px solid #FECACA' }
      case 'Ambiguous':
        return { background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A' }
      default:
        return { background: '#F3F4F6', color: '#4B5563', border: '1px solid #E5E7EB' }
    }
  }

  return (
    <section id="dsh-live" className="dsh-section">
      <SectionHead
        eyebrow="Live"
        title="Real usage"
        note="Updates every 5 seconds from actual chat traffic."
      />

      <div className="dsh-kpi-grid">
        <KpiTile
          label="Total queries"
          value={summary.totalQueries}
          format={(v) => String(v)}
          delta={null}
          caption="Questions asked in the chat so far."
        />
        <KpiTile
          label="Avg latency"
          value={summary.avgLatencyMs}
          format={(v) => `${v} ms`}
          delta={null}
          caption="Average response time across recent queries."
        />
        <KpiTile
          label="Avg confidence"
          value={summary.avgConfidence / 100}
          format={(v) => pct(v)}
          delta={null}
          caption="Average top-source similarity score."
        />
      </div>

      <div
        style={{
          marginTop: '1.25rem',
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB', color: '#4B5563', fontWeight: 600 }}>
                <th style={{ padding: '0.75rem 1rem', width: '55%' }}>Query</th>
                <th style={{ padding: '0.75rem 1rem', width: '15%' }}>Match Score</th>
                <th style={{ padding: '0.75rem 1rem', width: '15%' }}>Latency</th>
                <th style={{ padding: '0.75rem 1rem', width: '15%' }}>Evidence Quality</th>
              </tr>
            </thead>
            <tbody>
              {recentQueries.length > 0 ? (
                recentQueries.map((q, idx) => (
                  <tr
                    key={q.id}
                    style={{
                      borderBottom: idx === recentQueries.length - 1 ? 'none' : '1px solid #F3F4F6',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <td style={{ padding: '0.75rem 1rem', color: '#111827', fontWeight: 500 }}>
                      {q.query}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#374151', fontVariantNumeric: 'tabular-nums' }}>
                      {q.score}%
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#6B7280', fontVariantNumeric: 'tabular-nums' }}>
                      {q.latencyMs} ms
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          ...getQualityBadgeStyle(q.evidenceQuality),
                        }}
                      >
                        {q.evidenceQuality || 'Supported'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ padding: '1.5rem', textAlign: 'center', color: '#9CA3AF' }}>
                    No live queries logged yet. Questions submitted in the chat will appear here automatically.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

/* ============================================================
   2 — Retrieval quality
   ============================================================ */

function Retrieval({ run }) {
  const kSeries = Object.entries(run.precisionAtK).map(([label, points]) => ({
    label,
    points: points.map((p) => ({ x: p.k, y: p.value })),
  }))

  return (
    <section id="dsh-retrieval" className="dsh-section">
      <SectionHead
        eyebrow="Retrieval"
        title="Retrieval quality &amp; tuning"
        note="Where the top-K, chunk-size and search-strategy trade-offs land."
      />

      <div className="dsh-grid">
        <ChartCard
          title="Precision@K"
          subtitle="Precision falls as K grows — the cost of recall. K=5 is the working setting."
          legend={kSeries.map((s, i) => ({
            label: s.label,
            color: SERIES[i],
            shape: 'line',
          }))}
          table={{
            columns: ['K', ...kSeries.map((s) => s.label)],
            rows: [1, 3, 5, 10].map((k) => [
              `K = ${k}`,
              ...kSeries.map((s) => pct(s.points.find((p) => p.x === k)?.y ?? 0, 1)),
            ]),
          }}
        >
          <LineChart
            series={kSeries}
            yDomain={[0, 1]}
            formatY={(v) => pct(v)}
            formatX={(v) => `K=${v}`}
            formatValue={(v) => pct(v, 1)}
          />
        </ChartCard>

        <ChartCard
          title="Search strategy comparison"
          subtitle="Hybrid retrieval with a reranker wins on every measure — at the cost of a second pass."
          legend={[
            { label: 'Precision@3', color: SERIES[0] },
            { label: 'Precision@5', color: SERIES[1] },
            { label: 'Recall@5', color: SERIES[2] },
          ]}
          table={{
            columns: ['Strategy', 'Precision@3', 'Precision@5', 'Recall@5'],
            rows: run.strategies.map((s) => [
              s.name,
              pct(s.p3, 1),
              pct(s.p5, 1),
              pct(s.recall5, 1),
            ]),
          }}
        >
          <GroupedColumns
            groups={run.strategies.map((s) => ({
              name: s.name,
              values: [s.p3, s.p5, s.recall5],
            }))}
            seriesLabels={['Precision@3', 'Precision@5', 'Recall@5']}
            yMax={1}
            formatValue={(v) => pct(v)}
            rotateLabels
          />
        </ChartCard>

        <ChartCard
          title="Chunk size sweep"
          subtitle="Precision peaks mid-range: small chunks lose context, large ones dilute it."
          table={{
            columns: ['Chunk size', 'Precision@5', 'Median latency'],
            rows: run.chunkSweep.map((c) => [
              `${c.size} chars`,
              pct(c.precision, 1),
              `${c.latency} ms`,
            ]),
          }}
          footnote={`Overlap held at ${PIPELINE.chunkOverlap} characters throughout the sweep.`}
        >
          <div className="dsh-multiples">
            <div>
              <p className="dsh-multiple-title">Precision@5</p>
              <LineChart
                series={[
                  {
                    label: 'Precision@5',
                    points: run.chunkSweep.map((c) => ({ x: c.size, y: c.precision })),
                  },
                ]}
                height={165}
                yDomain={[0, 1]}
                formatY={(v) => pct(v)}
                formatX={(v) => v}
                formatValue={(v) => pct(v, 1)}
                xLabel="Chunk size (characters)"
              />
            </div>
            <div>
              <p className="dsh-multiple-title">Median latency</p>
              <LineChart
                series={[
                  {
                    label: 'Latency',
                    points: run.chunkSweep.map((c) => ({ x: c.size, y: c.latency })),
                  },
                ]}
                height={165}
                yDomain={[0, 1400]}
                formatY={(v) => `${Math.round(v)}`}
                formatX={(v) => v}
                formatValue={(v) => `${Math.round(v)} ms`}
                xLabel="Chunk size (characters)"
              />
            </div>
          </div>
        </ChartCard>

        <ChartCard
          title="Performance by question type"
          subtitle="Ambiguous questions are the weak spot — the failure analysis below says why."
          legend={[
            { label: 'Precision@5', color: SERIES[0] },
            { label: 'Citation accuracy', color: SERIES[1] },
          ]}
          table={{
            columns: ['Question type', 'Precision@5', 'Citation accuracy'],
            rows: run.categories.map((c) => [
              c.name,
              pct(c.precision, 1),
              pct(c.citation, 1),
            ]),
          }}
        >
          <GroupedColumns
            groups={run.categories.map((c) => ({
              name: c.name,
              values: [c.precision, c.citation],
            }))}
            seriesLabels={['Precision@5', 'Citation accuracy']}
            yMax={1}
            formatValue={(v) => pct(v)}
          />
        </ChartCard>
      </div>
    </section>
  )
}

/* ============================================================
   3 — Safety & guardrails
   ============================================================ */

function Safety({ run }) {
  const confidenceColors = [RAMP[3], RAMP[2], RAMP[1], INK.axis]

  return (
    <section id="dsh-safety" className="dsh-section">
      <SectionHead
        eyebrow="Safety"
        title="Guardrails &amp; grounding"
        note="What the system refuses, what it downgrades, and what it lets through."
      />

      <div className="dsh-grid">
        <ChartCard
          title="Similarity gate"
          subtitle={`Chunks scoring below ${PIPELINE.similarityThreshold} never reach the model.`}
          legend={[
            { label: 'Answered', color: SERIES[0] },
            { label: 'Refused by gate', color: STATUS.serious },
          ]}
          table={{
            columns: ['Similarity', 'Chunks', 'Outcome'],
            rows: run.similarity.map((b) => [
              b.bin.toFixed(2),
              String(b.count),
              b.bin < PIPELINE.similarityThreshold ? 'Refused' : 'Answered',
            ]),
          }}
        >
          <ThresholdHistogram
            bins={run.similarity}
            threshold={PIPELINE.similarityThreshold}
            belowColor={STATUS.serious}
          />
        </ChartCard>

        <ChartCard
          title="Answer confidence"
          subtitle="Confidence is downgraded, not hidden, when the evidence is thin."
          legend={run.confidence.map((c, i) => ({
            label: c.label,
            color: confidenceColors[i],
          }))}
          table={{
            columns: ['Confidence', 'Answers', 'Share'],
            rows: (() => {
              const total = run.confidence.reduce((sum, c) => sum + c.value, 0)
              return run.confidence.map((c) => [
                c.label,
                String(c.value),
                pct(c.value / total),
              ])
            })(),
          }}
        >
          <Donut
            segments={run.confidence}
            colors={confidenceColors}
            centerLabel="answers"
          />
        </ChartCard>

        <ChartCard
          title="Guardrail workflow"
          subtitle="Every query that drops out of a stage is withheld on purpose, not lost."
          table={{
            columns: ['Stage', 'Queries', 'Share of intake'],
            rows: run.funnel.map((s) => [
              s.stage,
              String(s.value),
              pct(s.value / run.funnel[0].value),
            ]),
          }}
        >
          <Funnel stages={run.funnel} colors={RAMP} />
        </ChartCard>

        <ChartCard
          title="Failure modes"
          subtitle="Counted from the manual review of every failed test case."
          table={{
            columns: ['Failure mode', 'Cases'],
            rows: run.failures.map((f) => [f.name, String(f.value)]),
          }}
        >
          <HorizontalBars items={run.failures} color={STATUS.serious} height={200} />
        </ChartCard>
      </div>
    </section>
  )
}

/* ============================================================
   4 — Corpus
   ============================================================ */

function Corpus({ run }) {
  const totalChunks = DOCUMENTS.reduce((sum, d) => sum + d.chunksOk + d.chunksDegraded, 0)
  const totalPages = DOCUMENTS.reduce((sum, d) => sum + d.pages, 0)
  const totalSections = DOCUMENTS.reduce((sum, d) => sum + d.sections, 0)

  return (
    <section id="dsh-corpus" className="dsh-section">
      <SectionHead
        eyebrow="Corpus"
        title="What the index actually holds"
        note={`${DOCUMENTS.length} sources · ${totalPages} pages · ${totalSections} sections · ${totalChunks} chunks`}
      />

      <div className="dsh-grid">
        <ChartCard
          title="Chunks per source"
          subtitle="The USPSTF PDF is multi-column, so a quarter of its chunks extract badly and are flagged rather than dropped."
          legend={[
            { label: 'Clean extraction', color: SERIES[0] },
            { label: 'Degraded extraction', color: STATUS.warning },
          ]}
          table={{
            columns: ['Source', 'Clean', 'Degraded', 'Pages', 'Sections'],
            rows: DOCUMENTS.map((d) => [
              d.short,
              String(d.chunksOk),
              String(d.chunksDegraded),
              String(d.pages),
              String(d.sections),
            ]),
          }}
        >
          <StackedBars
            items={DOCUMENTS.map((d) => ({
              name: d.short,
              values: [d.chunksOk, d.chunksDegraded],
            }))}
            seriesLabels={['Clean extraction', 'Degraded extraction']}
            colors={[SERIES[0], STATUS.warning]}
            height={200}
          />
        </ChartCard>

        <ChartCard
          title="Citations by source"
          subtitle="Which document the answers actually lean on across the test set."
          table={{
            columns: ['Source', 'Citations'],
            rows: run.citationsBySource.map((c) => [c.name, String(c.value)]),
          }}
          footnote="The WHO bulletin is the deliberate off-topic control — a low count here is the correct result."
        >
          <HorizontalBars items={run.citationsBySource} height={200} />
        </ChartCard>
      </div>
    </section>
  )
}

/* ============================================================
   5 — Evidence & live pipeline
   ============================================================ */

function Evidence() {
  const [samples, setSamples] = useState([])

  return (
    <section id="dsh-evidence" className="dsh-section">
      <SectionHead
        eyebrow="Evidence"
        title="Live pipeline"
        note="What the retriever returned, and how long each stage took."
      />

      <div className="dsh-grid">
        <ChartCard
          title="Retrieved evidence"
          subtitle={`Top ${PIPELINE.topK} chunks with scores and full citation metadata, shown before generation.`}
        >
          <EvidencePanel query={SAMPLE_QUERY} chunks={RETRIEVED_CHUNKS} />
        </ChartCard>

        <ChartCard
          title="Query latency"
          subtitle="Retrieval is steady; generation carries the variance, spiking on multi-chunk synthesis."
          legend={[
            { label: 'Retrieval', color: SERIES[0], shape: 'line' },
            { label: 'Generation', color: SERIES[1], shape: 'line' },
          ]}
          footnote="Milliseconds, both series on one scale. Streaming from the demo pipeline."
          table={{
            columns: ['Query', 'Retrieval', 'Generation', 'Total'],
            rows: samples.map((s) => [
              `#${s.x + 1}`,
              `${s.retrieval} ms`,
              `${s.generation} ms`,
              `${s.retrieval + s.generation} ms`,
            ]),
          }}
        >
          <LiveLatency onSamples={setSamples} />
        </ChartCard>
      </div>
    </section>
  )
}

function SectionHead({ eyebrow, title, note }) {
  return (
    <div className="dsh-section-head">
      <p className="dsh-eyebrow">{eyebrow}</p>
      <h2 className="dsh-section-title">{title}</h2>
      {note && <p className="dsh-section-note">{note}</p>}
    </div>
  )
}