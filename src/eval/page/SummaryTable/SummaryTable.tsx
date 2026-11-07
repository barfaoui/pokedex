import { useId } from 'react'
import type { AvailableEngine } from '@/eval/engines/engines'
import { summarize } from '@/eval/metrics'
import type { CaseRun } from '@/eval/run'
import { SUMMARY_ROWS, summaryCell, type SummaryRow } from '@/eval/summary-rows'
import './SummaryTable.scss'

interface SummaryTableProps {
  engines: AvailableEngine[]
  runs: CaseRun[]
}

export function SummaryTable({ engines, runs }: SummaryTableProps) {
  const summaries = engines.map((engine) =>
    summarize(runs.filter((run) => run.engineId === engine.id)),
  )
  return (
    <table className="summary-table">
      <caption className="summary-table__caption">
        Summary of the cases shown
      </caption>
      <thead>
        <tr>
          <th className="summary-table__head" scope="col">
            Metric
          </th>
          {engines.map((engine) => (
            <th
              key={engine.id}
              className="summary-table__head"
              scope="col"
              title={engine.about}
            >
              {engine.name}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {SUMMARY_ROWS.map((row) => (
          <tr key={row.label}>
            <th className="summary-table__label" scope="row">
              <MetricName row={row} />
            </th>
            {summaries.map((summary, at) => (
              <td key={engines[at].id} className="summary-table__value">
                {engines[at].placeholder ??
                  (summary.cases
                    ? summaryCell(row, summary, engines[at])
                    : '—')}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// A tooltip that opens on focus too, so the explanation isn't mouse-only.
function MetricName({ row }: { row: SummaryRow }) {
  const id = useId()
  return (
    <span className="summary-table__metric">
      {row.label}
      <button
        className="summary-table__help"
        type="button"
        aria-label={`What is ${row.label}?`}
        aria-describedby={id}
      >
        ?
      </button>
      <span className="summary-table__tip" role="tooltip" id={id}>
        {row.help}
      </span>
    </span>
  )
}
