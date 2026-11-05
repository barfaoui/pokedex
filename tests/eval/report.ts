import type { EvalCase, Split } from '@/eval/cases'
import type { AvailableEngine } from '@/eval/engines/engines'
import {
  gradeOf,
  groupRuns,
  summarize,
  type GroupBy,
  type Summary,
} from '@/eval/metrics'
import { keyOf, type CaseRun } from '@/eval/run'
import { decimal, euros, itemLabel, ms, percent } from '@/eval/format'
import { GLOSSARY } from '@/eval/glossary'
import { MODEL_DTYPE, MODEL_ID } from '@/search/semantic/model'

export interface Context {
  date: Date
  commit: string
  dirty: boolean | null
  machine: string
  /** null when no engine that ran needs the model. */
  modelLoadMs: number | null
  skipped: string[]
}

const SPLITS: { split: Split; title: string; intro: string }[] = [
  {
    split: 'holdout',
    title: 'Holdout',
    intro:
      'Never used to tune anything: the closest thing here to queries nobody has tried yet.',
  },
  {
    split: 'tuning',
    title: 'Tuning',
    intro: 'Used to set rules and thresholds, so expect these to look better.',
  },
]

// GitHub and VS Code render <details> folded; the blank lines let the list inside stay Markdown.
const GLOSSARY_LINES = [
  '<details>',
  '<summary>What the terms mean</summary>',
  '',
  ...GLOSSARY.map(({ term, meaning }) => `- **${term}**: ${meaning}`),
  '',
  '</details>',
]

const TOP_SHOWN = 5

export function formatReport(
  engines: AvailableEngine[],
  runs: CaseRun[],
  context: Context,
): string {
  const lines: string[] = []
  const push = (...more: string[]) => lines.push(...more)
  const cases = [...new Map(runs.map((r) => [r.evalCase.id, r.evalCase])).values()]

  push(
    `# Search evaluation · ${stamp(context.date)}`,
    '',
    '| | |',
    '| --- | --- |',
    `| Commit | ${context.commit}${context.dirty ? ' + uncommitted changes' : context.dirty === null ? ' (status unknown)' : ''} |`,
    `| Machine | ${context.machine} |`,
    `| Cases | ${SPLITS.map(({ split, title }) => `${cases.filter((c) => c.split === split).length} ${title.toLowerCase()}`).join(' · ')} (tests/eval/cases.csv) |`,
    `| Engines | ${engines.map((e) => e.name).join(' · ')}${context.skipped.length ? ` (not run: ${context.skipped.join(', ')})` : ''} |`,
    `| Model | ${MODEL_ID} (${MODEL_DTYPE}) |`,
    '',
    context.modelLoadMs === null
      ? 'Model load: not needed by the engines run.'
      : `Model load, once, before any query: ${ms(context.modelLoadMs)}.`,
    '',
    '**Timings are measured in Node on this machine, not in the browser.** In the app the model runs in a web worker on WebAssembly: expect it slower there. Open eval.html in `npm run dev` for browser timings.',
    '',
    '## Summary',
    '',
    ...GLOSSARY_LINES,
    '',
  )

  for (const { split, title, intro } of SPLITS) {
    const inSplit = runs.filter((r) => r.evalCase.split === split)
    push(
      `### ${title} (${cases.filter((c) => c.split === split).length} cases)`,
      '',
      intro,
      '',
      '| Engine | Pass | Hit@1 | Recall@10 | MRR | nDCG@10 | False positives | p50 | p95 | Cost / 1,000 |',
      '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
      ...engines.map((engine) =>
        summaryRow(
          engine.name,
          summarize(inSplit.filter((r) => r.engineId === engine.id)),
        ),
      ),
      '',
    )
  }

  push(...groupSection('category', 'By category', engines, runs))
  push(...groupSection('source', 'By source', engines, runs))
  push(...failingSection(engines, runs))

  return lines.join('\n')
}

function summaryRow(name: string, s: Summary): string {
  return `| ${name} | ${s.passed}/${s.cases} (${percent(s.passRate)}) | ${percent(s.hitAt1)} | ${percent(s.recallAt10)} | ${decimal(s.mrr)} | ${decimal(s.ndcgAt10)} | ${s.falsePositiveRate === null ? '—' : `${percent(s.falsePositiveRate)} of ${s.nothingCases}`} | ${ms(s.latencyP50)} | ${ms(s.latencyP95)} | ${euros(s.costPer1000)} |`
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
    'Pass rate · nDCG@10 for each engine.',
    '',
  ]
  for (const { split, title: splitTitle } of SPLITS) {
    const groups = groupRuns(
      runs.filter((r) => r.evalCase.split === split),
      by,
    )
    lines.push(
      `### ${splitTitle}`,
      '',
      `| ${by === 'category' ? 'Category' : 'Source'} | Cases | ${engines.map((e) => e.name).join(' | ')} |`,
      `| --- | --- | ${engines.map(() => '---').join(' | ')} |`,
      ...[...groups].map(([name, group]) => {
        const cells = engines.map((engine) => {
          const s = summarize(group.filter((r) => r.engineId === engine.id))
          return `${percent(s.passRate)} · ${decimal(s.ndcgAt10)}`
        })
        return `| ${name} | ${group.length / engines.length} | ${cells.join(' | ')} |`
      }),
      '',
    )
  }
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
      `${c.category} · ${c.split} · ${c.source} · check: ${c.check}${c.note ? ` · _${c.note}_` : ''}`,
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
