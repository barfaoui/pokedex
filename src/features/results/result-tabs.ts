import type { ResultKind, SearchResult } from '@/search/types/result'

export const RESULT_TABS = ['all', 'pokemon', 'abilities', 'moves'] as const

export type ResultTab = (typeof RESULT_TABS)[number]

const TAB_KINDS: Record<Exclude<ResultTab, 'all'>, ResultKind> = {
  pokemon: 'pokemon',
  abilities: 'ability',
  moves: 'move',
}

export function isResultTab(value: string): value is ResultTab {
  return (RESULT_TABS as readonly string[]).includes(value)
}

/** The results a tab shows, in the order search ranked them. */
export function resultsInTab(
  results: SearchResult[],
  tab: ResultTab,
): SearchResult[] {
  if (tab === 'all') {
    return results
  }
  return results.filter((result) => result.kind === TAB_KINDS[tab])
}

export function tabCounts(results: SearchResult[]): Record<ResultTab, number> {
  return {
    all: results.length,
    pokemon: resultsInTab(results, 'pokemon').length,
    abilities: resultsInTab(results, 'abilities').length,
    moves: resultsInTab(results, 'moves').length,
  }
}
