import { index } from '../data/dataset'
import type { PokedexIndex } from '../data/types/model'
import { parseQuery } from './parse'
import { scoreItem } from './score'
import { compareResults, sortMatches } from './sort'
import type { ParsedQuery, Sort } from './types/query'
import type { SearchableItem, SearchResult } from './types/result'

// Pokémon listed by a lone sort word without matching it: below any name match, never an exact match.
const LISTED_SCORE = 0.1

/**
 * Searches Pokémon, moves and abilities. Results scoring 0 are hidden; the
 * rest are sorted by score, then by the query's sort word if it has one.
 */
export function search(
  query: string,
  pokedex: PokedexIndex = index,
): SearchResult[] {
  const parsed = parseQuery(query)
  const items = searchableItems(pokedex)
  const results = parsed.parts.length
    ? matchingResults(parsed, items)
    : parsed.sort
      ? sortWordResults(parsed.sort, items)
      : []
  return results
    .map((result) => withSortMatches(result, parsed.sort))
    .sort(compareResults(parsed.sort))
}

function searchableItems(pokedex: PokedexIndex): SearchableItem[] {
  return [
    ...[...pokedex.pokemon.values()].map((item) => ({
      kind: 'pokemon' as const,
      item,
    })),
    ...[...pokedex.moves.values()].map((item) => ({
      kind: 'move' as const,
      item,
    })),
    ...[...pokedex.abilities.values()].map((item) => ({
      kind: 'ability' as const,
      item,
    })),
  ]
}

/** Scores every item and keeps those above 0; with a sort word, only Pokémon (the only items with the attribute). */
function matchingResults(
  parsed: ParsedQuery,
  items: SearchableItem[],
): SearchResult[] {
  return items
    .filter((searchable) => !parsed.sort || searchable.kind === 'pokemon')
    .map((searchable) => ({ ...searchable, ...scoreItem(parsed, searchable) }))
    .filter((result) => result.score > 0)
}

/** A lone sort word: its name matches first, then every other Pokémon, each listed once. */
function sortWordResults(sort: Sort, items: SearchableItem[]): SearchResult[] {
  const nameMatches = matchingResults(
    { parts: [{ kind: 'word', text: sort.word }] },
    items,
  )
  const found = new Set(nameMatches.map((result) => result.item))
  const listed = items
    .filter(
      (searchable) =>
        searchable.kind === 'pokemon' && !found.has(searchable.item),
    )
    .map((searchable) => ({ ...searchable, score: LISTED_SCORE, matched: [] }))
  return [...nameMatches, ...listed]
}

/** Adds the sorted attribute (e.g. speed 130) to what a Pokémon result shows. */
function withSortMatches(result: SearchResult, sort?: Sort): SearchResult {
  if (!sort || result.kind !== 'pokemon') {
    return result
  }
  return {
    ...result,
    matched: [...result.matched, ...sortMatches(sort, result.item)],
  }
}
