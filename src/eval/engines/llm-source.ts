import { USD_TO_EUR } from '../../../api/_lib/pricing'
import { modelLabel } from '@/eval/format'
import { DEFAULT_LLM_MODEL } from '@/eval/llm-models'
import { recordedLabel, snapshotFor } from '@/eval/llm-snapshot'
import { aiResults } from '@/features/ask-ai/ask-ai-client'
import type { SearchResult } from '@/search/types/result'
import type { EngineContext } from './engine'

export interface LlmAnswer {
  results: SearchResult[]
  /** Measured where the work happened: the provider's call, or the recorded run. */
  ms: number
  costEur: number
}

export interface LlmSource {
  modelName: string
  /** "live", or which recorded run. */
  about: string
  /** Billed: an engine using it sets `spentEur`, so warmUp never calls it. */
  live: boolean
  answer: (query: string) => Promise<LlmAnswer>
}

/** The LLM answers for the context's model: live when given a transport, else its recorded run. */
export function llmSource(options: EngineContext['llm']): LlmSource | null {
  const model = options?.model ?? DEFAULT_LLM_MODEL
  const modelName = `LLM: ${modelLabel(model)}`
  const askAi = options?.askAi
  if (askAi) {
    return {
      modelName,
      about: 'live',
      live: true,
      answer: async (query) => {
        const answer = await askAi(query)
        return {
          results: aiResults(answer.results),
          ms: answer.usage.latencyMs,
          costEur: answer.usage.costUsd * USD_TO_EUR,
        }
      },
    }
  }
  const snapshot = snapshotFor(model, options?.promptVersion)
  if (!snapshot) {
    return null
  }
  const byQuery = new Map(snapshot.cases.map((c) => [c.query, c]))
  return {
    modelName,
    about: recordedLabel(snapshot),
    live: false,
    answer: async (query) => {
      const recorded = byQuery.get(query)
      return {
        results: aiResults(recorded?.results ?? []),
        ms: recorded?.latencyMs ?? 0,
        costEur: (recorded?.costUsd ?? 0) * USD_TO_EUR,
      }
    },
  }
}
