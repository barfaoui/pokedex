import type { Split } from '@/eval/cases'
import type { AvailableEngine } from '@/eval/engines/engines'
import { decimal, euros, ms, percent } from '@/eval/format'
import { summarize, type Summary } from '@/eval/metrics'
import type { CaseRun } from '@/eval/run'
import './EngineCards.scss'

interface EngineCardsProps {
  engines: AvailableEngine[]
  runs: CaseRun[]
  /** '' for both, side by side: holdout and tuning are never added up. */
  split: string
}

const SPLITS: Split[] = ['holdout', 'tuning']

const ROWS: { label: string; value: (s: Summary) => string }[] = [
  {
    label: 'Pass',
    value: (s) => `${s.passed}/${s.cases} (${percent(s.passRate)})`,
  },
  { label: 'Hit@1', value: (s) => percent(s.hitAt1) },
  { label: 'Recall@10', value: (s) => percent(s.recallAt10) },
  { label: 'MRR', value: (s) => decimal(s.mrr) },
  { label: 'nDCG@10', value: (s) => decimal(s.ndcgAt10) },
  {
    label: 'False positives',
    value: (s) =>
      s.falsePositiveRate === null
        ? '—'
        : `${percent(s.falsePositiveRate)} of ${s.nothingCases}`,
  },
  {
    label: 'Latency p50 · p95',
    value: (s) => `${ms(s.latencyP50)} · ${ms(s.latencyP95)}`,
  },
  { label: 'Cost / 1,000', value: (s) => euros(s.costPer1000) },
]

export function EngineCards({ engines, runs, split }: EngineCardsProps) {
  const splits = SPLITS.filter((name) => !split || name === split)
  return (
    <section className="engine-cards" aria-label="Summary per engine">
      {engines.map((engine) => {
        const summaries = splits.map((name) =>
          summarize(
            runs.filter(
              (run) =>
                run.engineId === engine.id && run.evalCase.split === name,
            ),
          ),
        )
        return (
          <table key={engine.id} className="engine-cards__card">
            <caption className="engine-cards__name">{engine.name}</caption>
            <thead>
              <tr>
                <th className="engine-cards__head" scope="col" />
                {splits.map((name, at) => (
                  <th key={name} className="engine-cards__head" scope="col">
                    {name} ({summaries[at].cases})
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.label}>
                  <th className="engine-cards__label" scope="row">
                    {row.label}
                  </th>
                  {summaries.map((summary, at) => (
                    <td key={splits[at]} className="engine-cards__value">
                      {summary.cases ? row.value(summary) : '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )
      })}
    </section>
  )
}
