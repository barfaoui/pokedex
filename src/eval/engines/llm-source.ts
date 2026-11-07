import { USD_TO_EUR } from '../../../api/_lib/pricing'
import { configByKey, DEFAULT_CONFIG } from '../../../api/_lib/models'
import { recordedLabel, snapshotFor } from '@/eval/llm-snapshot'
import { aiResults } from '@/features/ask-ai/ask-ai-client'
import type { SearchResult } from '@/search/types/result'
import type { EngineContext } from './engine'

export interface LlmAnswer {
  results: SearchResult[]
  /** Measured where the work happened: the provider's call, or the recorded run. */
  ms: number
  costEur: number
  truncated: boolean
}

export interface LlmSource {
  modelName: string
  about: string
  /** Billed: an engine using it sets `spentEur`, so warmUp never calls it. */
  live: boolean
  /** Runs recorded before prompt v3 don't say which answers were cut off. */
  knowsCutOff: boolean
  answer: (query: string) => Promise<LlmAnswer>
}

export function llmSource(options: EngineContext['llm']): LlmSource | null {
  const config = configByKey(options?.model ?? '') ?? DEFAULT_CONFIG
  const modelName = `LLM (${config.label})`
  const askAi = options?.askAi
  if (askAi) {
    return {
      modelName,
      about: 'live',
      live: true,
      knowsCutOff: true,
      answer: async (query) => {
        const answer = await askAi(query)
        return {
          results: aiResults(answer.results),
          ms: answer.usage.latencyMs,
          costEur: answer.usage.costUsd * USD_TO_EUR,
          truncated: answer.truncated === true,
        }
      },
    }
  }
  const snapshot = snapshotFor(config.key, options?.promptVersion)
  if (!snapshot) {
    return null
  }
  const byQuery = new Map(snapshot.cases.map((c) => [c.query, c]))
  return {
    modelName,
    about: recordedLabel(snapshot),
    live: false,
    knowsCutOff: snapshot.cases.some((c) => c.truncated !== undefined),
    answer: async (query) => {
      const recorded = byQuery.get(query)
      return {
        results: aiResults(recorded?.results ?? []),
        ms: recorded?.latencyMs ?? 0,
        costEur: (recorded?.costUsd ?? 0) * USD_TO_EUR,
        truncated: recorded?.truncated === true,
      }
    },
  }
}
