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
