import type { Engine } from './engines/engine'
import { decimal, euros, ms, percent } from './format'
import type { Summary } from './metrics'

export interface SummaryRow {
  label: string
  value: (s: Summary) => string
  /** Latency and cost: meaningless for an engine that reads its answers. */
  measured?: true
}

export const NOT_MEASURED = 'not measured'

/** Shared, so the report and the page show the same table. */
export const SUMMARY_ROWS: SummaryRow[] = [
  {
    label: 'Queries passed',
    value: (s) => `${s.passed} of ${s.cases} (${percent(s.passRate)})`,
  },
  {
    label: 'Best answer first (Hit@1)',
    value: (s) => percent(s.hitAt1),
  },
  {
    label: 'Right answers in the top 10 (Recall@10)',
    value: (s) => percent(s.recallAt10),
  },
  {
    label: 'How high the first best answer is, 0 to 1 (MRR)',
    value: (s) => decimal(s.mrr),
  },
  {
    label: 'How good the top 10 order is, 0 to 1 (nDCG@10)',
    value: (s) => decimal(s.ndcgAt10),
  },
  {
    label: 'Noise queries that found something (false positives)',
    value: (s) =>
      s.falsePositiveRate === null
        ? '—'
        : `${percent(s.falsePositiveRate)} of ${s.nothingCases}`,
  },
  {
    label: 'Typical query time (p50)',
    value: (s) => ms(s.latencyP50),
    measured: true,
  },
  {
    label: 'Slow query time (p95)',
    value: (s) => ms(s.latencyP95),
    measured: true,
  },
  {
    label: 'Cost per 1,000 queries',
    value: (s) => euros(s.costPer1000),
    measured: true,
  },
]

export function summaryCell(
  row: SummaryRow,
  summary: Summary,
  engine: Engine,
): string {
  return row.measured && engine.notMeasured ? NOT_MEASURED : row.value(summary)
}
