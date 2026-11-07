import { needsSemantic } from '@/search/search'
import type { SearchResult } from '@/search/types/result'

export interface SuggestionContext {
  available: boolean
  settled: boolean
  askedAi: boolean
  deterministic: SearchResult[]
}

// The eval's Hybrid (D + LLM) rule: the AI is worth it when the deterministic search isn't sure.
export function suggestsAskAi(context: SuggestionContext): boolean {
  return (
    context.available &&
    context.settled &&
    !context.askedAi &&
    needsSemantic(context.deterministic)
  )
}
