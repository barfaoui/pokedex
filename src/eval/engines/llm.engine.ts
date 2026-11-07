import type { EngineDefinition } from './engine'
import { llmSource } from './llm-source'

// The same answers as the app's Ask AI button: live when given a transport (billed), otherwise the
// model's recorded run, with the latency and cost it had then. Neither: not created.
const llm: EngineDefinition = {
  id: 'llm',
  order: 5,
  create: ({ llm: options }) => {
    const source = llmSource(options)
    if (!source) {
      return null
    }
    const usage = new Map<string, { ms: number; costEur: number }>()
    let spentEur = 0
    return {
      name: source.modelName,
      shortName: 'LLM',
      about: source.about,
      search: async (query) => {
        const answer = await source.answer(query)
        usage.set(query, { ms: answer.ms, costEur: answer.costEur })
        spentEur += answer.costEur
        return answer.results
      },
      recorded: (query) => usage.get(query),
      ...(source.live ? { spentEur: () => spentEur } : {}),
    }
  },
}

export default llm
