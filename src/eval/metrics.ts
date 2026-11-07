import type { Check, EvalCase, ItemKey } from './cases'

const CUTOFF = 10
const TOP: Record<Exclude<Check, 'nothing'>, number> = {
  first: 1,
  top3: 3,
  top10: 10,
}
const GAIN = { best: 2, ok: 1 }

export interface CaseScore {
  passed: boolean
  failures: string[]
  firstBestRank: number | null
  hitAt1: number | null
  recallAt10: number | null
  reciprocalRank: number | null
  ndcgAt10: number | null
  forbiddenFound: string[]
}

export function matchesItem(resultKey: string, item: ItemKey): boolean {
  return item.includes(':')
    ? resultKey === item
    : resultKey.slice(resultKey.indexOf(':') + 1) === item
}

function isAny(resultKey: string, items: ItemKey[]): boolean {
  return items.some((item) => matchesItem(resultKey, item))
}

export type Grade = 'forbidden' | 'best' | 'ok' | null

export function gradeOf(evalCase: EvalCase, resultKey: string): Grade {
  if (isAny(resultKey, evalCase.forbidden)) {
    return 'forbidden'
  }
  if (isAny(resultKey, evalCase.best)) {
    return 'best'
  }
  return isAny(resultKey, evalCase.ok) ? 'ok' : null
}

/** `ranked`: `kind:name` keys, best first. */
export function scoreCase(evalCase: EvalCase, ranked: string[]): CaseScore {
  const forbiddenFound = ranked.filter((key) => isAny(key, evalCase.forbidden))
  const failures = forbiddenFound.length
    ? [`forbidden: ${forbiddenFound.join(', ')}`]
    : []

  if (evalCase.check === 'nothing') {
    if (ranked.length) {
      failures.push(`should find nothing, found ${ranked.length}`)
    }
    return {
      passed: !failures.length,
      failures,
      firstBestRank: null,
      hitAt1: null,
      recallAt10: null,
      reciprocalRank: null,
      ndcgAt10: null,
      forbiddenFound,
    }
  }

  const firstBest = ranked.findIndex((key) => isAny(key, evalCase.best))
  const firstBestRank = firstBest < 0 ? null : firstBest + 1
  failures.push(...topFailures(evalCase, ranked, firstBestRank))

  return {
    passed: !failures.length,
    failures,
    firstBestRank,
    hitAt1: firstBestRank === 1 ? 1 : 0,
    recallAt10: recallAt10(evalCase, ranked),
    reciprocalRank: firstBestRank ? 1 / firstBestRank : 0,
    ndcgAt10: ndcgAt10(evalCase, ranked),
    forbiddenFound,
  }
}

/**
 * The top N holds as many best items as fit: all of them when there are N or fewer, only best
 * items when there are more (“fire, water” lists 45 for a top 10).
 */
function topFailures(
  evalCase: EvalCase,
  ranked: string[],
  firstBestRank: number | null,
): string[] {
  const top = TOP[evalCase.check as keyof typeof TOP]
  const wanted = Math.min(top, evalCase.best.length)
  const inTop = ranked.slice(0, top).filter((key) => isAny(key, evalCase.best))
  if (inTop.length >= wanted) {
    return []
  }
  if (top === 1) {
    return [
      firstBestRank === null
        ? 'no best item found'
        : `best item at rank ${firstBestRank}, not first`,
    ]
  }
  return [`${inTop.length} of ${wanted} best items in the top ${top}`]
}

/** Out of the relevant items that fit in 10, so 45 relevant items can still reach 1. */
export function recallAt10(evalCase: EvalCase, ranked: string[]): number {
  const relevant = [...evalCase.best, ...evalCase.ok]
  const found = relevant.filter((item) =>
    ranked.slice(0, CUTOFF).some((key) => matchesItem(key, item)),
  ).length
  return found / Math.min(relevant.length, CUTOFF)
}

function gainOf(evalCase: EvalCase, key: string): number {
  if (isAny(key, evalCase.best)) {
    return GAIN.best
  }
  return isAny(key, evalCase.ok) ? GAIN.ok : 0
}

function dcg(gains: number[]): number {
  return gains
    .slice(0, CUTOFF)
    .reduce((sum, gain, at) => sum + gain / Math.log2(at + 2), 0)
}

export function ndcgAt10(evalCase: EvalCase, ranked: string[]): number {
  const ideal = dcg([
    ...evalCase.best.map(() => GAIN.best),
    ...evalCase.ok.map(() => GAIN.ok),
  ])
  return ideal ? dcg(ranked.map((key) => gainOf(evalCase, key))) / ideal : 0
}

export interface ScoredRun {
  evalCase: EvalCase
  score: CaseScore
  ms: number
  costEur: number
  /** Set by an engine with an LLM fallback: whether this query went to the LLM. */
  sentToLlm?: boolean
  cutOff?: boolean
}

export interface Summary {
  cases: number
  passed: number
  passRate: number
  /** Means over the cases that have a right answer; null when there are none. */
  hitAt1: number | null
  recallAt10: number | null
  mrr: number | null
  ndcgAt10: number | null
  nothingCases: number
  /** Share of `nothing` cases that returned anything. */
  falsePositiveRate: number | null
  latencyP50: number
  latencyP95: number
  costPer1000: number
  /** Queries sent to the LLM; null for an engine without a fallback. */
  sentToLlm: number | null
  /** LLM answers cut at max_tokens; null when the engine doesn't know. */
  cutOff: number | null
}

export function summarize(runs: ScoredRun[]): Summary {
  const nothing = runs.filter((run) => run.evalCase.check === 'nothing')
  const noisy = nothing.filter((run) => !run.score.passed).length
  const passed = runs.filter((run) => run.score.passed).length
  const latencies = runs.map((run) => run.ms)
  const spent = runs.reduce((sum, run) => sum + run.costEur, 0)
  return {
    cases: runs.length,
    passed,
    passRate: runs.length ? passed / runs.length : 0,
    hitAt1: mean(runs.map((run) => run.score.hitAt1)),
    recallAt10: mean(runs.map((run) => run.score.recallAt10)),
    mrr: mean(runs.map((run) => run.score.reciprocalRank)),
    ndcgAt10: mean(runs.map((run) => run.score.ndcgAt10)),
    nothingCases: nothing.length,
    falsePositiveRate: nothing.length ? noisy / nothing.length : null,
    latencyP50: percentile(latencies, 50),
    latencyP95: percentile(latencies, 95),
    costPer1000: runs.length ? (spent / runs.length) * 1000 : 0,
    sentToLlm: runs.some((run) => run.sentToLlm !== undefined)
      ? runs.filter((run) => run.sentToLlm).length
      : null,
    cutOff: runs.some((run) => run.cutOff !== undefined)
      ? runs.filter((run) => run.cutOff).length
      : null,
  }
}

function mean(values: (number | null)[]): number | null {
  const known = values.filter((value) => value !== null)
  return known.length
    ? known.reduce((sum, value) => sum + value, 0) / known.length
    : null
}

/** Nearest rank: always one of the measured values. */
export function percentile(values: number[], p: number): number {
  if (!values.length) {
    return 0
  }
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.max(Math.ceil((p / 100) * sorted.length) - 1, 0)]
}

export type GroupBy = 'category' | 'source'

export function groupRuns<T extends { evalCase: EvalCase }>(
  runs: T[],
  by: GroupBy,
): Map<string, T[]> {
  const groups = new Map<string, T[]>()
  for (const run of runs) {
    const name = run.evalCase[by] || '(none)'
    groups.set(name, [...(groups.get(name) ?? []), run])
  }
  return new Map([...groups].sort(([a], [b]) => a.localeCompare(b)))
}
