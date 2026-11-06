import type { AiAnswer, AiEntry } from '../../api/_lib/ask-ai'

export const NO_RECORDED_RUN = 'No recorded LLM run yet'

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

/** tests/eval/llm-snapshot.json: a live run downloaded from the /eval page, then committed. */
export interface LlmSnapshot {
  model: string
  promptVersion: string
  date: string
  totalCostUsd: number
  cases: SnapshotCase[]
}

// A glob, not an import: the file only exists once a run has been recorded.
const files = import.meta.glob<unknown>('/tests/eval/llm-snapshot.json', {
  eager: true,
  import: 'default',
})

export const LLM_SNAPSHOT: LlmSnapshot | null = readSnapshot(
  Object.values(files)[0],
)

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

export function snapshotSummary(snapshot: LlmSnapshot): string {
  return `${snapshot.date.slice(0, 10)}, ${snapshot.model}, prompt ${snapshot.promptVersion}, ${snapshot.cases.length} queries, ${dollars(snapshot.totalCostUsd)} in total`
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
