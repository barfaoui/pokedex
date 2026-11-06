import type { AvailableEngine } from '@/eval/engines/engines'
import { decimal, itemLabel, percent } from '@/eval/format'
import { groupRuns, matchesItem, summarize, type Summary } from '@/eval/metrics'
import { keyOf, type CaseRun } from '@/eval/run'

const LLM = 'claude-code-reference'
const HYBRID = 'hybrid'
/** Categories whose answer is a whole list the data decides, where every missing item is a miss. */
const EXACT_LISTS = ['type', 'stats', 'number']

interface Gap {
  name: string
  cases: number
  llm: Summary
  hybrid: Summary
  pass: number
  ndcg: number
}

export function llmSection(
  engines: AvailableEngine[],
  runs: CaseRun[],
): string[] {
  const llm = engines.find((e) => e.id === LLM)
  if (!llm || !engines.some((e) => e.id === HYBRID)) {
    return []
  }
  const own = (group: CaseRun[], id: string) =>
    group.filter((r) => r.engineId === id)
  const gapOf = (name: string, group: CaseRun[]): Gap => {
    const l = summarize(own(group, LLM))
    const h = summarize(own(group, HYBRID))
    return {
      name,
      cases: l.cases,
      llm: l,
      hybrid: h,
      pass: l.passRate - h.passRate,
      ndcg: (l.ndcgAt10 ?? 0) - (h.ndcgAt10 ?? 0),
    }
  }
  const overall = gapOf('**Overall**', runs)
  const categories = [...groupRuns(runs, 'category')]
    .map(([name, group]) => gapOf(name, group))
    .sort(
      (a, b) =>
        Math.abs(b.pass) - Math.abs(a.pass) ||
        Math.abs(b.ndcg) - Math.abs(a.ndcg) ||
        a.name.localeCompare(b.name),
    )
  const winner = (g: Gap) => Math.sign(g.pass || g.ndcg)
  const names = (gaps: Gap[]) =>
    gaps.length ? gaps.map((g) => g.name).join(', ') : 'none'

  return [
    '## Is an LLM worth adding?',
    '',
    `Claude Code (reference) against Hybrid (deterministic + embeddings). Gap = Claude Code minus hybrid: above 0, Claude Code does better. Categories from the biggest pass-rate gap to the smallest, then by nDCG@10 gap.`,
    '',
    '| Category | Cases | Claude Code passed | Hybrid passed | Gap | Claude Code nDCG@10 | Hybrid nDCG@10 | Gap |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
    ...[overall, ...categories].map(
      (g) =>
        `| ${g.name} | ${g.cases} | ${percent(g.llm.passRate)} | ${percent(g.hybrid.passRate)} | ${points(g.pass)} | ${decimal(g.llm.ndcgAt10)} | ${decimal(g.hybrid.ndcgAt10)} | ${signed(g.ndcg)} |`,
    ),
    '',
    'Winner by pass rate, nDCG@10 when the pass rates tie.',
    '',
    `- **The LLM wins:** ${names(categories.filter((g) => winner(g) > 0))}`,
    `- **The hybrid wins:** ${names(categories.filter((g) => winner(g) < 0))}`,
    `- **Even:** ${names(categories.filter((g) => winner(g) === 0))}`,
    '',
    ...inventedPart(llm, own(runs, LLM)),
    ...missedPart(own(runs, LLM)),
  ]
}

function inventedPart(llm: AvailableEngine, runs: CaseRun[]): string[] {
  const invented = runs.flatMap((run) => {
    const keys = llm.invented?.(run.evalCase.query) ?? []
    return keys.length
      ? [`- ${caseLabel(run)}: ${keys.map(itemLabel).join(', ')}`]
      : []
  })
  return [
    '### Invented keys',
    '',
    'Keys the LLM answered that the data doesn’t hold. They are left out of its scored results.',
    '',
    ...(invented.length
      ? invented
      : ['None: every key it answered is in the data.']),
    '',
  ]
}

function missedPart(runs: CaseRun[]): string[] {
  const exact = runs.filter(
    (run) =>
      EXACT_LISTS.includes(run.evalCase.category) &&
      run.evalCase.best.length > 0,
  )
  const missed = exact.flatMap((run) => {
    const keys = run.results.map(keyOf)
    const missing = run.evalCase.best.filter(
      (item) => !keys.some((key) => matchesItem(key, item)),
    )
    return missing.length
      ? [
          `- ${caseLabel(run)}: ${missing.length} of ${run.evalCase.best.length} missing · ${missing.map(itemLabel).join(', ')}`,
        ]
      : []
  })
  return [
    `### Right items missed on exact lists (${EXACT_LISTS.join(', ')})`,
    '',
    `Best items absent from anywhere in the LLM’s answer, over the ${exact.length} cases of these categories.`,
    '',
    ...(missed.length ? missed : ['None: it listed every right item.']),
    '',
  ]
}

function caseLabel(run: CaseRun): string {
  return `${run.evalCase.id}. "${run.evalCase.query}" (${run.evalCase.category})`
}

function points(ratio: number): string {
  const value = Math.round(ratio * 100)
  return `${value > 0 ? '+' : value < 0 ? '−' : ''}${Math.abs(value)} pts`
}

function signed(value: number): string {
  const rounded = Number(value.toFixed(2))
  return `${rounded > 0 ? '+' : rounded < 0 ? '−' : ''}${Math.abs(rounded).toFixed(2)}`
}
