import { USD_TO_EUR } from '../../../api/_lib/pricing'
import { aiResults } from '@/features/ask-ai/ask-ai-client'
import { LLM_SNAPSHOT, snapshotSummary } from '@/eval/llm-snapshot'
import type { EngineDefinition } from './engine'

// The committed run of the live LLM engine: free to show, with the latency and cost it had then.
const llmRecorded: EngineDefinition = {
  id: 'llm-recorded',
  order: 5,
  create: () => {
    const snapshot = LLM_SNAPSHOT
    if (!snapshot) {
      return null
    }
    const byQuery = new Map(snapshot.cases.map((c) => [c.query, c]))
    return {
      name: 'LLM (recorded)',
      about: `Recorded run: ${snapshotSummary(snapshot)}.`,
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

export default llmRecorded
