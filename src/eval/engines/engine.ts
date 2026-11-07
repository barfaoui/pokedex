import type { AiAnswer } from '../../../api/_lib/ask-ai'
import type { SearchResult } from '@/search/types/result'

export type RankedResults = SearchResult[]

export interface Engine {
  name: string
  search: (query: string) => Promise<RankedResults>
  /** In euros; local engines leave it out, so warmUp knows they cost nothing. */
  spentEur?: () => number
  notMeasured?: string
  invented?: (query: string) => string[]
  /** Read after `search`: the provider's or the recorded latency replaces the time measured around it. */
  recorded?: (query: string) => { ms: number; costEur: number } | undefined
  about?: string
  placeholder?: string
  sentToLlm?: (query: string) => boolean
  cutOff?: (query: string) => boolean
}

/** One model, loaded once, shared by every engine. */
export interface SemanticSearch {
  search: (query: string) => Promise<SearchResult[]>
  /** The model's load time, in ms. */
  ready: () => Promise<number>
}

export interface EngineContext {
  semantic: () => SemanticSearch
  /** process.env in the CLI, import.meta.env in the page (only VITE_ names reach it). */
  env: Record<string, string | undefined>
  llm?: {
    /** A config key (api/_lib/models.ts), not a model id. */
    model?: string
    promptVersion?: number
    /** Only for a live run: left out, the engine reads its recorded run, so nothing is billed by accident. */
    askAi?: (query: string) => Promise<AiAnswer>
  }
}

// One `<id>.engine.ts` file per engine: engines.ts finds them itself, with no registration.
export interface EngineDefinition {
  id: string
  order: number
  create: (context: EngineContext) => Engine | null
}
