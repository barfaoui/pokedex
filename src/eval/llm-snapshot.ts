import type { AiAnswer, AiEntry } from '../../api/_lib/ask-ai'

export const NO_RUN_YET = 'no run yet'

export interface SnapshotCase {
  id: string
  query: string
  results: AiEntry[]
  note?: string
  latencyMs: number
  inputTokens: number
  cacheReadTokens: number
  cacheWriteTokens: number
  outputTokens: number
  costUsd: number
}

/** tests/eval/llm-snapshots/<model id>.json, written by `npm run eval -- --engine llm --save`. */
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

/** Recorded runs by model id. */
export const LLM_SNAPSHOTS: ReadonlyMap<string, LlmSnapshot> = new Map(
  Object.values(files).flatMap((value) => {
    const snapshot = readSnapshot(value)
    return snapshot ? [[snapshot.model, snapshot] as const] : []
  }),
)

export function snapshotPath(model: string): string {
  return `tests/eval/llm-snapshots/${model}.json`
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
  const number = /\d+$/.exec(promptVersion)?.[0]
  return number ? `v${number}` : promptVersion
}

/** "recorded on 2026-11-06, prompt v1". */
export function recordedLabel(snapshot: LlmSnapshot): string {
  return `recorded on ${snapshot.date.slice(0, 10)}, prompt ${promptLabel(snapshot.promptVersion)}`
}

function readSnapshot(value: unknown): LlmSnapshot | null {
  if (!value || typeof value !== 'object') {
    return null
  }
  const snapshot = value as Partial<LlmSnapshot>
  return typeof snapshot.model === 'string' &&
    typeof snapshot.date === 'string' &&
    Array.isArray(snapshot.cases)
    ? (snapshot as LlmSnapshot)
    : null
}
