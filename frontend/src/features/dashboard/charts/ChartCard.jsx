import { useId, useState } from 'react'

/**
 * The frame every panel sits in.
 *
 * It owns three things the charts should not have to repeat: the heading, the
 * legend, and the chart/table toggle. The table is not a nicety — it is how a
 * value stays readable when colour alone fails (colour-blind readers, print,
 * forced-colours mode), so every panel is given one.
 */
export default function ChartCard({
  title,
  subtitle,
  legend,
  table,
  footnote,
  span = 1,
  children,
}) {
  const [view, setView] = useState('chart')
  const headingId = useId()

  return (
    <section
      className={`dsh-card dsh-card--span-${span}`}
      aria-labelledby={headingId}
    >
      <header className="dsh-card-head">
        <div className="dsh-card-titles">
          <h3 className="dsh-card-title" id={headingId}>
            {title}
          </h3>
          {subtitle && <p className="dsh-card-sub">{subtitle}</p>}
        </div>

        {table && (
          <div className="dsh-toggle" role="group" aria-label={`${title} view`}>
            <button
              type="button"
              className={view === 'chart' ? 'is-active' : ''}
              onClick={() => setView('chart')}
              aria-pressed={view === 'chart'}
            >
              Chart
            </button>
            <button
              type="button"
              className={view === 'table' ? 'is-active' : ''}
              onClick={() => setView('table')}
              aria-pressed={view === 'table'}
            >
              Table
            </button>
          </div>
        )}
      </header>

      {legend && view === 'chart' && <Legend items={legend} />}

      <div className="dsh-card-body">
        {view === 'chart' ? children : <DataTable {...table} />}
      </div>

      {footnote && <p className="dsh-card-foot">{footnote}</p>}
    </section>
  )
}

/**
 * Always shown when a panel plots two or more series. The swatch beside the
 * text carries the identity — the label itself stays in ink, because a light
 * series colour (the yellow especially) is unreadable as text on white.
 */
export function Legend({ items }) {
  return (
    <ul className="dsh-legend">
      {items.map((item) => (
        <li key={item.label}>
          <span
            className={`dsh-swatch${item.shape === 'line' ? ' dsh-swatch--line' : ''}`}
            style={{ background: item.color }}
            aria-hidden="true"
          />
          {item.label}
        </li>
      ))}
    </ul>
  )
}

function DataTable({ columns, rows }) {
  return (
    <div className="dsh-table-wrap">
      <table className="dsh-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column} scope="col">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, cellIndex) =>
                cellIndex === 0 ? (
                  <th key={cellIndex} scope="row">
                    {cell}
                  </th>
                ) : (
                  <td key={cellIndex}>{cell}</td>
                )
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
