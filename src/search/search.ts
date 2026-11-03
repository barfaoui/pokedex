import { index } from '../data/dataset'
import type { PokedexIndex } from '../data/types/model'
import { normalize } from './normalize'
import { scoreName } from './score'
import type { SearchableItem, SearchResult } from './types'

// Starting value; will be tuned as more search layers are added.
const MIN_SCORE = 0.5

export function search(
  query: string,
  pokedex: PokedexIndex = index,
): SearchResult[] {
  const parts = normalize(query).split(' ').filter(Boolean)
  if (!parts.length) {
    return []
  }
  return searchableItems(pokedex)
    .map((searchable) =>
      toResult(searchable, scoreName(parts, searchable.item.searchName)),
    )
    .filter((result) => result.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score)
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

function toResult(searchable: SearchableItem, score: number): SearchResult {
  return {
    ...searchable,
    score,
    matched: [{ field: 'name', value: searchable.item.name }],
  }
}
