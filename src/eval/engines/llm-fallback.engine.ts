import { search } from '@/search/search'
import { CONFIDENT_SCORE } from '@/search/scores'
import type { EngineDefinition } from './engine'
import { llmSource } from './llm-source'

export const NEEDS_LLM_RUN = 'needs an LLM run'
export const FALLBACK_NAME = 'Hybrid (D + LLM)'

// The deterministic search when it is confident, the LLM otherwise. Never the weak deterministic
// results: an empty LLM answer stays empty, so noise queries stay empty too.
const llmFallback: EngineDefinition = {
  id: 'llm-fallback',
  order: 6,
  create: ({ llm: options }) => {
    const source = llmSource(options)
    if (!source) {
      return null
    }
    const usage = new Map<string, { ms: number; costEur: number }>()
    const sent = new Set<string>()
    let spentEur = 0
    return {
      name: FALLBACK_NAME,
      about: `fallback: ${source.modelName}, ${source.about}`,
      search: async (query) => {
        const start = performance.now()
        const deterministic = search(query)
        const ms = performance.now() - start
        const top = Math.max(0, ...deterministic.map((result) => result.score))
        if (top >= CONFIDENT_SCORE) {
          sent.delete(query)
          usage.set(query, { ms, costEur: 0 })
          return deterministic
        }
        const answer = await source.answer(query)
        sent.add(query)
        usage.set(query, { ms: ms + answer.ms, costEur: answer.costEur })
        spentEur += answer.costEur
        return answer.results
      },
      recorded: (query) => usage.get(query),
      sentToLlm: (query) => sent.has(query),
      ...(source.live ? { spentEur: () => spentEur } : {}),
    }
  },
}

export default llmFallback
