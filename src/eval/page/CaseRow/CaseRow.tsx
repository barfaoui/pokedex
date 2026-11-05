import type { EvalCase } from '@/eval/cases'
import type { AvailableEngine } from '@/eval/engines/engines'
import { itemLabel, ms } from '@/eval/format'
import type { CaseRun } from '@/eval/run'
import { NOT_MEASURED } from '@/eval/summary-rows'
import { AppLink } from '../AppLink/AppLink'
import { RankedList } from '../RankedList/RankedList'
import './CaseRow.scss'

interface CaseRowProps {
  evalCase: EvalCase
  engines: AvailableEngine[]
  runs: CaseRun[]
  open: boolean
  onToggle: () => void
}

const TOP_SHOWN = 5

export function CaseRow({
  evalCase,
  engines,
  runs,
  open,
  onToggle,
}: CaseRowProps) {
  const runOf = (engine: AvailableEngine) =>
    runs.find((run) => run.engineId === engine.id)
  return (
    <>
      {/* The whole row opens; the button gives it a keyboard stop and a state. */}
      <tr className="case-row" data-clickable="true" onClick={onToggle}>
        <td className="case-row__cell">
          <span className="case-row__title">
            <button
              className="case-row__query"
              type="button"
              aria-expanded={open}
            >
              {evalCase.query}
            </button>
            <AppLink query={evalCase.query} />
          </span>
          <span className="case-row__meta">
            {evalCase.id} · {evalCase.category} · {evalCase.source}
          </span>
        </td>
        <td className="case-row__cell">
          {expectedLines(evalCase).map((line) => (
            <span key={line} className="case-row__expected">
              {line}
            </span>
          ))}
        </td>
        {engines.map((engine) => {
          const run = runOf(engine)
          return (
            <td key={engine.id} className="case-row__cell">
              {run && (
                <>
                  <span
                    className="case-row__verdict"
                    data-passed={run.score.passed}
                  >
                    {run.score.passed ? '✓ pass' : '✗ fail'} · first best at{' '}
                    {run.score.firstBestRank ?? '—'}
                  </span>
                  <RankedList
                    results={run.results}
                    query={evalCase.query}
                    evalCase={evalCase}
                    limit={TOP_SHOWN}
                  />
                </>
              )}
            </td>
          )
        })}
      </tr>
      {open && (
        <tr className="case-row">
          <td className="case-row__cell" colSpan={2}>
            {evalCase.note && (
              <span className="case-row__meta">{evalCase.note}</span>
            )}
          </td>
          {engines.map((engine) => {
            const run = runOf(engine)
            return (
              <td key={engine.id} className="case-row__cell">
                {run && (
                  <>
                    <span className="case-row__meta">
                      {engine.notMeasured ? NOT_MEASURED : ms(run.ms)}
                      {run.score.failures.length > 0 &&
                        ` · ${run.score.failures.join('; ')}`}
                    </span>
                    <RankedList
                      results={run.results}
                      query={evalCase.query}
                      evalCase={evalCase}
                    />
                  </>
                )}
              </td>
            )
          })}
        </tr>
      )}
    </>
  )
}

function expectedLines(evalCase: EvalCase): string[] {
  if (evalCase.check === 'nothing') {
    return ['nothing']
  }
  return [
    `${evalCase.check}: ${evalCase.best.map(itemLabel).join(', ')}`,
    ...(evalCase.ok.length
      ? [`okay: ${evalCase.ok.map(itemLabel).join(', ')}`]
      : []),
    ...(evalCase.forbidden.length
      ? [`never: ${evalCase.forbidden.map(itemLabel).join(', ')}`]
      : []),
  ]
}
