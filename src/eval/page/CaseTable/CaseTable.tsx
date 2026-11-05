import { useState } from 'react'
import type { EvalCase } from '@/eval/cases'
import type { AvailableEngine } from '@/eval/engines/engines'
import type { CaseRun } from '@/eval/run'
import { CaseRow } from '../CaseRow/CaseRow'
import './CaseTable.scss'

interface CaseTableProps {
  cases: EvalCase[]
  engines: AvailableEngine[]
  runs: CaseRun[]
}

export function CaseTable({ cases, engines, runs }: CaseTableProps) {
  const [open, setOpen] = useState<string | null>(null)
  const runsByCase = new Map<string, CaseRun[]>()
  for (const run of runs) {
    runsByCase.set(run.evalCase.id, [
      ...(runsByCase.get(run.evalCase.id) ?? []),
      run,
    ])
  }

  return (
    <table className="case-table">
      <caption className="case-table__caption">
        {cases.length} cases · click a query for every result with its score and
        what it matched on
      </caption>
      <thead>
        <tr>
          <th className="case-table__head" scope="col">
            Query
          </th>
          <th className="case-table__head" scope="col">
            Expected
          </th>
          {engines.map((engine) => (
            <th key={engine.id} className="case-table__head" scope="col">
              {engine.name}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {cases.map((evalCase) => (
          <CaseRow
            key={evalCase.id}
            evalCase={evalCase}
            engines={engines}
            runs={runsByCase.get(evalCase.id) ?? []}
            open={open === evalCase.id}
            onToggle={() =>
              setOpen((current) =>
                current === evalCase.id ? null : evalCase.id,
              )
            }
          />
        ))}
      </tbody>
    </table>
  )
}
