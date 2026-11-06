import type { EvalCase } from '@/eval/cases'
import type { AvailableEngine } from '@/eval/engines/engines'
import { gradeOf, groupRuns, summarize, type GroupBy } from '@/eval/metrics'
import { keyOf, type CaseRun } from '@/eval/run'
import { decimal, itemLabel, ms, percent } from '@/eval/format'
import { SUMMARY_ROWS, summaryCell } from '@/eval/summary-rows'
import { MODEL_DTYPE, MODEL_ID } from '@/search/semantic/model'
import { llmSection } from './llm-section'

export interface Context {
  date: Date
  commit: string
  dirty: boolean | null
  machine: string
  /** null when no engine that ran needs the model. */
  modelLoadMs: number | null
  skipped: string[]
  /** Said when there is no recorded LLM run; empty otherwise. */
  llmNote: string
}

const TOP_SHOWN = 5

export function formatReport(
  engines: AvailableEngine[],
  runs: CaseRun[],
  context: Context,
): string {
  const lines: string[] = []
  const push = (...more: string[]) => lines.push(...more)
  const cases = [
    ...new Map(runs.map((r) => [r.evalCase.id, r.evalCase])).values(),
  ]

  push(
    `# Search evaluation · ${stamp(context.date)}`,
    '',
    '| | |',
    '| --- | --- |',
    `| Commit | ${context.commit}${context.dirty ? ' + uncommitted changes' : context.dirty === null ? ' (status unknown)' : ''} |`,
    `| Machine | ${context.machine} |`,
    `| Cases | ${cases.length} (tests/eval/cases.csv) |`,
    `| Engines | ${engines.map((e) => e.name).join(' · ')}${context.skipped.length ? ` (not run: ${context.skipped.join(', ')})` : ''} |`,
    `| Model | ${MODEL_ID} (${MODEL_DTYPE}) |`,
    '',
    context.modelLoadMs === null
      ? 'Model load: not needed by the engines run.'
      : `Model load, once, before any query: ${ms(context.modelLoadMs)}.`,
    '',
    '**Timings are measured in Node on this machine, not in the browser.** In the app the model runs in a web worker on WebAssembly: expect it slower there. Open eval.html in `npm run dev` for browser timings.',
    '',
    ...engines.flatMap((e) =>
      e.notMeasured ? [`**${e.name}:** ${e.notMeasured}`, ''] : [],
    ),
    ...engines.flatMap((e) =>
      e.about ? [`**${e.name}:** ${e.about}`, ''] : [],
    ),
    ...(context.llmNote ? [`**LLM:** ${context.llmNote}`, ''] : []),
    '## Summary',
    '',
  )

  const summaries = engines.map((engine) =>
    summarize(runs.filter((r) => r.engineId === engine.id)),
  )
  push(
    `| Metric | ${engines.map((e) => e.name).join(' | ')} |`,
    `| --- | ${engines.map(() => '---:').join(' | ')} |`,
    ...SUMMARY_ROWS.map(
      (row) =>
        `| ${row.label} | ${summaries.map((s, at) => summaryCell(row, s, engines[at])).join(' | ')} |`,
    ),
    '',
    ...SUMMARY_ROWS.map((row) => `- **${row.label}:** ${row.help}`),
    '',
  )

  push(...groupSection('category', 'By category', engines, runs))
  push(...groupSection('source', 'By source', engines, runs))
  push(...llmSection(engines, runs))
  push(...failingSection(engines, runs))

  return lines.join('\n')
}

function groupSection(
  by: GroupBy,
  title: string,
  engines: AvailableEngine[],
  runs: CaseRun[],
): string[] {
  const lines = [
    `## ${title}`,
    '',
    'For each engine: queries passed · how good the top 10 order is (nDCG@10, 0 to 1).',
    '',
    `| ${by === 'category' ? 'Category' : 'Source'} | Cases | ${engines.map((e) => e.name).join(' | ')} |`,
    `| --- | ---: | ${engines.map(() => '---:').join(' | ')} |`,
    ...[...groupRuns(runs, by)].map(([name, group]) => {
      const cells = engines.map((engine) => {
        const s = summarize(group.filter((r) => r.engineId === engine.id))
        return `${percent(s.passRate)} · ${decimal(s.ndcgAt10)}`
      })
      return `| ${name} | ${group.length / engines.length} | ${cells.join(' | ')} |`
    }),
    '',
  ]
  return lines
}

function failingSection(engines: AvailableEngine[], runs: CaseRun[]): string[] {
  const byCase = new Map<string, CaseRun[]>()
  for (const run of runs) {
    byCase.set(run.evalCase.id, [...(byCase.get(run.evalCase.id) ?? []), run])
  }
  const failing = [...byCase.values()].filter((caseRuns) =>
    caseRuns.some((r) => !r.score.passed),
  )
  const lines = [
    `## Failing cases (${failing.length})`,
    '',
    `Every case that fails on at least one engine, with the top ${TOP_SHOWN} each engine returned. **Bold**: a best answer, _italic_: an okay one, ⛔: forbidden.`,
    '',
  ]
  for (const caseRuns of failing) {
    const c = caseRuns[0].evalCase
    lines.push(
      `### ${c.id}. "${c.query}"`,
      '',
      `${c.category} · ${c.source} · check: ${c.check}${c.note ? ` · _${c.note}_` : ''}`,
      '',
      expected(c),
      '',
      `| Engine | | First best at | Top ${TOP_SHOWN} | Why |`,
      '| --- | --- | --- | --- | --- |',
      ...engines.flatMap((engine) => {
        const run = caseRuns.find((r) => r.engineId === engine.id)
        if (!run) {
          return []
        }
        const top = run.results
          .slice(0, TOP_SHOWN)
          .map((result) => marked(c, keyOf(result)))
        return [
          `| ${engine.name} | ${run.score.passed ? '✓' : '✗'} | ${run.score.firstBestRank ?? '—'} | ${top.join(', ') || 'nothing'}${run.results.length > TOP_SHOWN ? ` (+${run.results.length - TOP_SHOWN})` : ''} | ${run.score.failures.join('; ')} |`,
        ]
      }),
      '',
    )
  }
  return lines
}

function expected(c: EvalCase): string {
  const parts = []
  if (c.best.length) {
    parts.push(`best: ${c.best.map(itemLabel).join(', ')}`)
  }
  if (c.ok.length) {
    parts.push(`okay: ${c.ok.map(itemLabel).join(', ')}`)
  }
  if (c.forbidden.length) {
    parts.push(`never: ${c.forbidden.map(itemLabel).join(', ')}`)
  }
  return parts.length ? `Expected: ${parts.join(' · ')}` : 'Expected: nothing'
}

function marked(c: EvalCase, key: string): string {
  const plain = itemLabel(key)
  switch (gradeOf(c, key)) {
    case 'forbidden':
      return `⛔ ${plain}`
    case 'best':
      return `**${plain}**`
    case 'ok':
      return `_${plain}_`
    case null:
      return plain
  }
}

export function stamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}
