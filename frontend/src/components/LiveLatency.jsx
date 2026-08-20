import React, { useEffect, useState } from 'react'

const MAX_SAMPLES = 12

export default function LiveLatency({ onSamples }) {
  const [samples, setSamples] = useState([
    { x: 0, retrieval: 140, generation: 1850 },
    { x: 1, retrieval: 165, generation: 1920 },
    { x: 2, retrieval: 120, generation: 1740 },
    { x: 3, retrieval: 190, generation: 2870 },
  ])

  useEffect(() => {
    onSamples?.(samples)
  }, [samples, onSamples])

  useEffect(() => {
    // Periodic stream simulator to reflect real API calls
    const interval = setInterval(() => {
      setSamples((prev) => {
        const nextX = prev.length > 0 ? prev[prev.length - 1].x + 1 : 0
        const newSample = {
          x: nextX,
          retrieval: Math.floor(120 + Math.random() * 80),
          generation: Math.floor(1600 + Math.random() * 1400),
        }
        const updated = [...prev.slice(-(MAX_SAMPLES - 1)), newSample]
        return updated
      })
    }, 6000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ width: '100%', height: '200px', position: 'relative' }}>
      <svg width="100%" height="100%" viewBox="0 0 500 180" preserveAspectRatio="none">
        {/* Horizontal grid lines */}
        <line x1="30" y1="20" x2="480" y2="20" stroke="#F1F5F9" strokeWidth="1" />
        <line x1="30" y1="70" x2="480" y2="70" stroke="#F1F5F9" strokeWidth="1" />
        <line x1="30" y1="120" x2="480" y2="120" stroke="#F1F5F9" strokeWidth="1" />
        <line x1="30" y1="160" x2="480" y2="160" stroke="#E2E8F0" strokeWidth="1" />

        {/* Generation Latency Area / Polyline (Amber/Orange) */}
        <polyline
          fill="none"
          stroke="#F59E0B"
          strokeWidth="2.5"
          points={samples
            .map((s, idx) => {
              const x = 40 + (idx / Math.max(1, samples.length - 1)) * 430
              const y = 160 - (s.generation / 3500) * 140
              return `${x},${y}`
            })
            .join(' ')}
        />

        {/* Retrieval Latency Polyline (Blue) */}
        <polyline
          fill="none"
          stroke="#3B82F6"
          strokeWidth="2.5"
          points={samples
            .map((s, idx) => {
              const x = 40 + (idx / Math.max(1, samples.length - 1)) * 430
              const y = 160 - (s.retrieval / 3500) * 140
              return `${x},${y}`
            })
            .join(' ')}
        />

        {/* Data points */}
        {samples.map((s, idx) => {
          const x = 40 + (idx / Math.max(1, samples.length - 1)) * 430
          const yGen = 160 - (s.generation / 3500) * 140
          const yRet = 160 - (s.retrieval / 3500) * 140
          return (
            <g key={idx}>
              <circle cx={x} cy={yGen} r="3.5" fill="#F59E0B" />
              <circle cx={x} cy={yRet} r="3.5" fill="#3B82F6" />
            </g>
          )
        })}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.25rem' }}>
        <span>Earlier</span>
        <span>Latest Query</span>
      </div>
    </div>
  )
}