import type { AiAnswer } from '../../../api/_lib/ask-ai'
import type { SearchResult } from '@/search/types/result'

/** Best first. An engine that isn't the app's search builds these from `index` items. */
export type RankedResults = SearchResult[]

export interface Engine {
  name: string
  search: (query: string) => Promise<RankedResults>
  /** Euros billed so far (an engine billed in dollars converts); local engines leave it out. */
  spentEur?: () => number
  /** Set by an engine that reads its answers instead of computing them: why latency and cost aren't measured. */
  notMeasured?: string
  /** Keys it answered that the data doesn't hold, left out of its results. */
  invented?: (query: string) => string[]
  /**
   * Latency and cost measured where the work happened (the AI provider's call, or a recorded run),
   * read after `search`: they replace the time measured around it.
   */
  recorded?: (query: string) => { ms: number; costEur: number } | undefined
  /** One line for the report and the page, e.g. which recorded run this is. */
  about?: string
  /** The live LLM engine's full answers, to save the run as a snapshot. */
  answerOf?: (query: string) => AiAnswer | undefined
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
  /**
   * Ask AI, for the live LLM engine: /api/ask-ai, given only by the eval page. Left out (as in the
   * CLI), the engine isn't created, so nothing is ever billed by accident.
   */
  askAi?: (query: string) => Promise<AiAnswer>
}

/**
 * One file per engine, named `<id>.engine.ts` in this folder: engines.ts finds it on its own.
 * `create` returns null when the engine can't run, e.g. a paid engine without its API key.
 */
export interface EngineDefinition {
  id: string
  /** Report and page order. */
  order: number
  create: (context: EngineContext) => Engine | null
}
