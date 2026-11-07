import type { AiAnswer } from '../../api/_lib/ask-ai'

export const NO_RUN_YET = 'no run yet'

export interface SnapshotCase {
  id: string
  query: string
  results: string[]
  note?: string
  latencyMs: number
  inputTokens: number
  cacheReadTokens: number
  cacheWriteTokens: number
  outputTokens: number
  costUsd: number
}

/**
 * tests/eval/llm-snapshots/<model id>.prompt-v<n>.json, written by `npm run eval -- --engine llm
 * --save`: one file per prompt version, so a new prompt never overwrites an older run.
 */
export interface LlmSnapshot {
  model: string
  promptVersion: string
  date: string
  totalCostUsd: number
  cases: SnapshotCase[]
}

// A glob, not an import: a model has a file only once a run has been recorded.
const files = import.meta.glob<unknown>('/tests/eval/llm-snapshots/*.json', {
  eager: true,
  import: 'default',
})

const SNAPSHOTS: LlmSnapshot[] = Object.values(files).flatMap((value) => {
  const snapshot = readSnapshot(value)
  return snapshot ? [snapshot] : []
})

/** "ask-ai-1" → 1; null for a version without a number. */
export function promptNumber(promptVersion: string): number | null {
  const number = /\d+$/.exec(promptVersion)?.[0]
  return number ? Number(number) : null
}

/** The model's recorded run for that prompt version, the latest version when left out. */
export function snapshotFor(
  model: string,
  promptVersion?: number,
): LlmSnapshot | undefined {
  const own = SNAPSHOTS.filter((snapshot) => snapshot.model === model)
  if (promptVersion !== undefined) {
    return own.find((s) => promptNumber(s.promptVersion) === promptVersion)
  }
  return own.reduce<LlmSnapshot | undefined>(
    (latest, s) =>
      !latest ||
      (promptNumber(s.promptVersion) ?? 0) >
        (promptNumber(latest.promptVersion) ?? 0)
        ? s
        : latest,
    undefined,
  )
}

export function snapshotPath(model: string, promptVersion: string): string {
  return `tests/eval/llm-snapshots/${model}.prompt-${promptLabel(promptVersion)}.json`
}

export function buildSnapshot(
  answers: { id: string; query: string; answer: AiAnswer }[],
  date = new Date(),
): LlmSnapshot {
  const cases = answers.map(({ id, query, answer }) => ({
    id,
    query,
    results: answer.results,
    ...(answer.note ? { note: answer.note } : {}),
    latencyMs: Math.round(answer.usage.latencyMs),
    inputTokens: answer.usage.inputTokens,
    cacheReadTokens: answer.usage.cacheReadTokens,
    cacheWriteTokens: answer.usage.cacheWriteTokens,
    outputTokens: answer.usage.outputTokens,
    costUsd: answer.usage.costUsd,
  }))
  return {
    model: answers[0]?.answer.model ?? 'unknown',
    promptVersion: answers[0]?.answer.promptVersion ?? 'unknown',
    date: date.toISOString(),
    totalCostUsd: cases.reduce((sum, c) => sum + c.costUsd, 0),
    cases,
  }
}

export function dollars(value: number): string {
  return `$${value < 0.01 && value > 0 ? value.toFixed(4) : value.toFixed(2)}`
}

/** "ask-ai-1" → "v1". */
export function promptLabel(promptVersion: string): string {
  const number = promptNumber(promptVersion)
  return number === null ? promptVersion : `v${number}`
}

/** "recorded on 2026-11-06". */
export function recordedLabel(snapshot: LlmSnapshot): string {
  return `recorded on ${snapshot.date.slice(0, 10)}`
}

function readSnapshot(value: unknown): LlmSnapshot | null {
  if (!value || typeof value !== 'object') {
    return null
  }
  const snapshot = value as Partial<LlmSnapshot>
  if (
    typeof snapshot.model !== 'string' ||
    typeof snapshot.date !== 'string' ||
    !Array.isArray(snapshot.cases)
  ) {
    return null
  }
  return {
    ...(snapshot as LlmSnapshot),
    cases: snapshot.cases.map((c) => ({ ...c, results: keysOf(c.results) })),
  }
}

// Prompt v1 answered { key, note } for each result, later prompts the key alone.
function keysOf(results: unknown[]): string[] {
  return results.flatMap((entry) => {
    const key =
      typeof entry === 'string' ? entry : (entry as { key?: unknown })?.key
    return typeof key === 'string' ? [key] : []
  })
}
