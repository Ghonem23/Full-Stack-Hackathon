import { SERIES, STATUS } from '@/features/dashboard/theme'
import { PIPELINE } from '@/features/dashboard/data/benchmark'

/**
 * The evidence panel the brief asks for: the retrieved chunks, their scores and
 * their full metadata, shown *before* anything is generated.
 *
 * This is the panel that demonstrates traceability to a judge — every row
 * carries the document, section, page and chunk id that a citation would point
 * at, so a claim in the answer can be walked back to its source in one step.
 */
export default function EvidencePanel({ query, chunks }) {
  return (
    <div className="dsh-evidence">
      <p className="dsh-evidence-query">
        <span className="dsh-evidence-query-label">Query</span>
        {query}
      </p>

      <ol className="dsh-evidence-list">
        {chunks.map((chunk) => {
          const passes = chunk.score >= PIPELINE.similarityThreshold

          return (
            <li key={chunk.chunkId} className="dsh-evidence-item">
              <div className="dsh-evidence-top">
                <span className="dsh-rank">#{chunk.rank}</span>

                <div className="dsh-evidence-cite">
                  <p className="dsh-evidence-doc">{chunk.documentName}</p>
                  <p className="dsh-evidence-meta">
                    {chunk.sectionTitle} · p.{chunk.pageNumber} ·{' '}
                    <code>{chunk.chunkId}</code>
                  </p>
                </div>

                <div className="dsh-score">
                  <span className="dsh-score-value">{chunk.score.toFixed(3)}</span>
                  {/* The track is a lighter step of the fill's own ramp, so the
                      state reads across the whole bar and not just the filled
                      part. */}
                  <span className="dsh-score-track">
                    <span
                      className="dsh-score-fill"
                      style={{
                        width: `${chunk.score * 100}%`,
                        background: passes ? SERIES[0] : STATUS.serious,
                      }}
                    />
                  </span>
                </div>
              </div>

              <p className="dsh-evidence-excerpt">{chunk.excerpt}</p>

              <div className="dsh-chips">
                <span className={`dsh-chip ${passes ? 'is-good' : 'is-warn'}`}>
                  <span aria-hidden="true">{passes ? '✓' : '!'}</span>
                  {passes ? 'Above gate' : 'Below gate'}
                </span>

                {chunk.textQuality === 'degraded' && (
                  <span className="dsh-chip is-warn">
                    <span aria-hidden="true">!</span> Degraded extraction
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
