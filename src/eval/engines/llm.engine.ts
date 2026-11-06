import type { AiAnswer } from '../../../api/_lib/ask-ai'
import { USD_TO_EUR } from '../../../api/_lib/pricing'
import { aiResults } from '@/features/ask-ai/ask-ai-client'
import type { EngineDefinition } from './engine'

// The same answers as the app's Ask AI button. Billed: only created when given a transport.
const llm: EngineDefinition = {
  id: 'llm',
  order: 6,
  create: ({ askAi }) => {
    if (!askAi) {
      return null
    }
    const answers = new Map<string, AiAnswer>()
    let spentEur = 0
    return {
      name: 'LLM (live)',
      search: async (query) => {
        const answer = await askAi(query)
        answers.set(query, answer)
        spentEur += answer.usage.costUsd * USD_TO_EUR
        return aiResults(answer.results)
      },
      spentEur: () => spentEur,
      recorded: (query) => {
        const answer = answers.get(query)
        return (
          answer && {
            ms: answer.usage.latencyMs,
            costEur: answer.usage.costUsd * USD_TO_EUR,
          }
        )
      },
      answerOf: (query) => answers.get(query),
    }
  },
}

export default llm
