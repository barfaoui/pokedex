import type { AiAnswer } from '../../../api/_lib/ask-ai'
import { USD_TO_EUR } from '../../../api/_lib/pricing'
import { modelLabel } from '@/eval/format'
import { DEFAULT_LLM_MODEL } from '@/eval/llm-models'
import { LLM_SNAPSHOTS, recordedLabel } from '@/eval/llm-snapshot'
import { aiResults } from '@/features/ask-ai/ask-ai-client'
import type { Engine, EngineDefinition } from './engine'

// The same answers as the app's Ask AI button: live when given a transport (billed), otherwise the
// model's recorded run, with the latency and cost it had then. Neither: not created.
const llm: EngineDefinition = {
  id: 'llm',
  order: 4,
  create: ({ llm: options }) => {
    const model = options?.model ?? DEFAULT_LLM_MODEL
    const named = { name: `LLM: ${modelLabel(model)}`, shortName: 'LLM' }
    const askAi = options?.askAi
    if (askAi) {
      return { ...named, about: 'live', ...liveRun(askAi) }
    }
    const snapshot = LLM_SNAPSHOTS.get(model)
    if (!snapshot) {
      return null
    }
    const byQuery = new Map(snapshot.cases.map((c) => [c.query, c]))
    return {
      ...named,
      about: recordedLabel(snapshot),
      search: async (query) => aiResults(byQuery.get(query)?.results ?? []),
      recorded: (query) => {
        const recorded = byQuery.get(query)
        return (
          recorded && {
            ms: recorded.latencyMs,
            costEur: recorded.costUsd * USD_TO_EUR,
          }
        )
      },
    }
  },
}

function liveRun(
  askAi: (query: string) => Promise<AiAnswer>,
): Pick<Engine, 'search' | 'spentEur' | 'recorded'> {
  const usage = new Map<string, { ms: number; costEur: number }>()
  let spentEur = 0
  return {
    search: async (query) => {
      const answer = await askAi(query)
      const costEur = answer.usage.costUsd * USD_TO_EUR
      usage.set(query, { ms: answer.usage.latencyMs, costEur })
      spentEur += costEur
      return aiResults(answer.results)
    },
    spentEur: () => spentEur,
    recorded: (query) => usage.get(query),
  }
}

export default llm
