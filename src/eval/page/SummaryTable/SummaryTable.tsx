import type { AvailableEngine } from '@/eval/engines/engines'
import { summarize } from '@/eval/metrics'
import type { CaseRun } from '@/eval/run'
import { SUMMARY_ROWS, summaryCell } from '@/eval/summary-rows'
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
              title={engine.shortName ? engine.name : undefined}
            >
              {engine.shortName ?? engine.name}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {SUMMARY_ROWS.map((row) => (
          <tr key={row.label}>
            <th className="summary-table__label" scope="row">
              {row.label}
            </th>
            {summaries.map((summary, at) => (
              <td key={engines[at].id} className="summary-table__value">
                {summary.cases ? summaryCell(row, summary, engines[at]) : '—'}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
