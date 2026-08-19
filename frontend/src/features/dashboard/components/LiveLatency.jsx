import { useEffect, useRef, useState } from 'react'
import LineChart from '@/features/dashboard/charts/LineChart'

/**
 * The one panel that moves on its own: retrieval and generation latency as
 * queries stream through the pipeline.
 *
 * Both series are milliseconds, so they share one axis honestly. It runs off a
 * generator for now; pointing it at a websocket or an SSE endpoint later means
 * replacing nextSample() and leaving the rest alone.
 */

const WINDOW = 14
const TICK_MS = 1400

function nextSample(index) {
  // Retrieval is steady; generation is the noisy half, and occasionally spikes
  // when a long multi-chunk answer has to be synthesised.
  const spike = Math.random() < 0.15
  return {
    x: index,
    retrieval: Math.round(180 + Math.random() * 90),
    generation: Math.round((spike ? 1500 : 620) + Math.random() * 260),
  }
}

const seed = () => Array.from({ length: WINDOW }, (_, i) => nextSample(i))

export default function LiveLatency({ height = 250, onSamples }) {
  const [samples, setSamples] = useState(seed)
  const [running, setRunning] = useState(true)
  const counter = useRef(WINDOW)

  useEffect(() => {
    if (!running) return undefined

    const id = setInterval(() => {
      setSamples((current) => {
        const next = nextSample(counter.current)
        counter.current += 1
        return [...current.slice(1), next]
      })
    }, TICK_MS)

    return () => clearInterval(id)
  }, [running])

  const series = [
    {
      label: 'Retrieval',
      points: samples.map((s) => ({ x: s.x, y: s.retrieval })),
    },
    {
      label: 'Generation',
      points: samples.map((s) => ({ x: s.x, y: s.generation })),
    },
  ]

  const latest = samples[samples.length - 1]

  // Hand the current window up so the card's table view shows exactly what the
  // plot is showing, rather than a stale copy.
  useEffect(() => {
    onSamples?.(samples)
  }, [samples, onSamples])

  return (
    <>
      <div className="dsh-live-bar">
        <span className={`dsh-live-dot${running ? ' is-live' : ''}`} aria-hidden="true" />
        <span className="dsh-live-text">
          {running ? 'Streaming' : 'Paused'} · last query{' '}
          <b>{latest.retrieval + latest.generation} ms</b>
        </span>
        <button
          type="button"
          className="dsh-ghost-btn"
          onClick={() => setRunning((value) => !value)}
        >
          {running ? 'Pause' : 'Resume'}
        </button>
      </div>

      <LineChart
        series={series}
        height={height}
        yDomain={[0, 2000]}
        formatY={(v) => `${Math.round(v)}`}
        formatX={(v) => `#${v + 1}`}
        formatValue={(v) => `${Math.round(v)} ms`}
        xLabel="Query"
      />
    </>
  )
}
