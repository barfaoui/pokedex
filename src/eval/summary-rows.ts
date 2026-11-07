import type { Engine } from './engines/engine'
import { decimal, euros, ms, percent } from './format'
import type { Summary } from './metrics'

export interface SummaryRow {
  label: string
  /** One sentence, for the page's "?" and the report's legend. */
  help: string
  value: (s: Summary) => string
  /** Latency and cost: meaningless for an engine that reads its answers. */
  measured?: true
}

export const NOT_MEASURED = 'not measured'

/** Shared, so the report and the page show the same table. */
export const SUMMARY_ROWS: SummaryRow[] = [
  {
    label: 'Passed',
    help: 'The case’s check is met and no forbidden answer appears.',
    value: (s) => `${s.passed} of ${s.cases} (${percent(s.passRate)})`,
  },
  {
    label: 'Hit@1',
    help: 'The first result is a best answer.',
    value: (s) => percent(s.hitAt1),
  },
  {
    label: 'Recall@10',
    help: 'Share of the right answers found in the top 10.',
    value: (s) => percent(s.recallAt10),
  },
  {
    label: 'MRR',
    help: '1 ÷ the rank of the first best answer, averaged.',
    value: (s) => decimal(s.mrr),
  },
  {
    label: 'nDCG@10',
    help: 'How good the order of the top 10 is, from 0 to 1 (best = 2 points, ok = 1, lower ranks count less).',
    value: (s) => decimal(s.ndcgAt10),
  },
  {
    label: 'False positives',
    help: 'Share of noise queries that returned anything.',
    value: (s) =>
      s.falsePositiveRate === null
        ? '—'
        : `${percent(s.falsePositiveRate)} of ${s.nothingCases}`,
  },
  {
    label: 'p50 / p95',
    help: 'The typical and the slow query time.',
    value: (s) => `${ms(s.latencyP50)} / ${ms(s.latencyP95)}`,
    measured: true,
  },
  {
    label: 'Cost per 1,000 queries',
    help: 'What 1,000 queries cost in API fees: 0 for an engine that runs locally.',
    value: (s) => euros(s.costPer1000),
    measured: true,
  },
  {
    label: 'Sent to the LLM',
    help: 'Queries the deterministic search wasn’t confident about (top score under CONFIDENT_SCORE), answered by the LLM instead.',
    value: (s) =>
      s.sentToLlm === null
        ? '—'
        : `${s.sentToLlm} of ${s.cases} (${percent(s.sentToLlm / s.cases)})`,
  },
  {
    label: 'Cut off',
    help: 'LLM answers that hit the output limit: only the keys written in full before the cut are kept.',
    value: (s) => (s.cutOff === null ? '—' : String(s.cutOff)),
  },
]

export function summaryCell(
  row: SummaryRow,
  summary: Summary,
  engine: Engine,
): string {
  return row.measured && engine.notMeasured ? NOT_MEASURED : row.value(summary)
}
