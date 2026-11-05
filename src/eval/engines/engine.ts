import type { SearchResult } from '@/search/types/result'

/** Best first. An engine that isn't the app's search builds these from `index` items. */
export type RankedResults = SearchResult[]

export interface Engine {
  name: string
  search: (query: string) => Promise<RankedResults>
  /** Euros billed so far (an engine billed in dollars converts); local engines leave it out. */
  spentEur?: () => number
}

/** The app's search by meaning, alone: one model, loaded once, shared by every engine. */
export interface SemanticSearch {
  search: (query: string) => Promise<SearchResult[]>
  /** Resolves with the model's load time once it can answer. */
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
