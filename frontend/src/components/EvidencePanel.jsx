import React, { useState } from 'react'

export default function EvidencePanel({ query, chunks = [] }) {
  const [expandedIndex, setExpandedIndex] = useState(0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {query && (
        <div
          style={{
            padding: '0.6rem 0.85rem',
            background: '#F8FAFC',
            borderRadius: '8px',
            border: '1px solid #E2E8F0',
            fontSize: '0.8125rem',
            color: '#334155',
          }}
        >
          <strong style={{ color: '#0F172A' }}>Evaluated Query:</strong> {query}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {chunks.map((chunk, idx) => {
          const isExpanded = expandedIndex === idx
          return (
            <div
              key={chunk.chunkId || idx}
              style={{
                border: isExpanded ? '1px solid #93C5FD' : '1px solid #E2E8F0',
                borderRadius: '8px',
                background: isExpanded ? '#F0F9FF' : '#FFFFFF',
                overflow: 'hidden',
                transition: 'all 0.2s ease',
              }}
            >
              <div
                onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                style={{
                  padding: '0.65rem 0.85rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    style={{
                      background: '#0284C7',
                      color: '#ffffff',
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.4rem',
                      borderRadius: '4px',
                    }}
                  >
                    #{idx + 1}
                  </span>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0F172A' }}>
                    {chunk.source || chunk.title}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    Page {chunk.page} · {chunk.section || 'Overview'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0369A1' }}>
                    {chunk.score}% match
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    {isExpanded ? '▲' : '▼'}
                  </span>
                </div>
              </div>

              {isExpanded && (
                <div
                  style={{
                    padding: '0.75rem 0.85rem',
                    borderTop: '1px solid #BAE6FD',
                    background: '#FFFFFF',
                    fontSize: '0.8125rem',
                    lineHeight: '1.45',
                    color: '#334155',
                  }}
                >
                  {chunk.text}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}