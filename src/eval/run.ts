import type { SearchResult } from '@/search/types/result'
import type { EvalCase } from './cases'
import type { AvailableEngine } from './engines/engines'
import { scoreCase, type ScoredRun } from './metrics'

export interface CaseRun extends ScoredRun {
  engineId: string
  results: SearchResult[]
}

export function keyOf(result: SearchResult): string {
  return `${result.kind}:${result.item.name}`
}

export async function runCase(
  engine: AvailableEngine,
  evalCase: EvalCase,
): Promise<CaseRun> {
  const spentBefore = engine.spentEur?.() ?? 0
  const start = performance.now()
  const results = await engine.search(evalCase.query)
  const measured = performance.now() - start
  const recorded = engine.recorded?.(evalCase.query)
  return {
    engineId: engine.id,
    evalCase,
    results,
    ms: recorded?.ms ?? measured,
    costEur: recorded?.costEur ?? (engine.spentEur?.() ?? 0) - spentBefore,
    score: scoreCase(evalCase, results.map(keyOf)),
  }
}

/** The first call compiles and caches; timing it would only measure that. A billed engine is skipped. */
export async function warmUp(engines: AvailableEngine[]): Promise<void> {
  for (const engine of engines) {
    if (!engine.spentEur) {
      await engine.search('make the enemy doze off')
    }
  }
}

export async function runAll(
  engines: AvailableEngine[],
  cases: EvalCase[],
  onRun?: (run: CaseRun) => void,
): Promise<CaseRun[]> {
  const runs: CaseRun[] = []
  for (const evalCase of cases) {
    for (const engine of engines) {
      const run = await runCase(engine, evalCase)
      runs.push(run)
      onRun?.(run)
    }
  }
  return runs
}
