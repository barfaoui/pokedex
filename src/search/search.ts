import { index } from '../data/dataset'
import type { PokedexIndex } from '../data/types/model'
import { withEvolutionFamilies } from './evolution'
import {
  exclusionsOf,
  NO_EXCLUSIONS,
  withoutExcluded,
  type Exclusions,
} from './exclusion'
import { parseQuery } from './parse'
import { scoreItem } from './score'
import { compareResults, sortMatches } from './sort'
import type { ParsedQuery, Sort } from './types/query'
import type { ResultKind, SearchableItem, SearchResult } from './types/result'

// Pokémon listed by a lone sort word without matching it: below any name match, never an exact match.
const LISTED_SCORE = 0.1

// The kinds a query doesn't ask for stay visible, below the asked kind: for "pokemon that
// paralyzes", Thunder Wave (0.85) drops to 0.6, under Pikachu (0.82).
const OTHER_KIND_WEIGHT = 0.7

// Set with the PRD queries: "pikachoo" (0.71) is the weakest answer that must count as confident.
export const CONFIDENT_SCORE = 0.7

export function needsSemantic(results: SearchResult[]): boolean {
  return !results.some((result) => result.score >= CONFIDENT_SCORE)
}

/**
 * Searches Pokémon, moves and abilities. Results scoring 0 are hidden; the
 * rest are sorted by score, then by the query's sort word if it has one.
 */
export function search(
  query: string,
  pokedex: PokedexIndex = index,
): SearchResult[] {
  const parsed = parseQuery(query)
  const results = parsed.parts.length
    ? matchingResults(parsed, pokedex)
    : parsed.sort
      ? sortWordResults(parsed.sort, pokedex)
      : parsed.excluded
        ? listedItems(pokedex, parsed.kinds ?? ['pokemon'], new Set())
        : []
  return withoutExcluded(results, exclusionsOf(parsed, pokedex).rules)
    .map((result) => withSortMatches(result, parsed.sort))
    .sort(compareResults(parsed.sort))
}

/** What the query excludes with "not" / "no", for the note above the results. */
export function queryExclusions(
  query: string,
  pokedex: PokedexIndex = index,
): Exclusions {
  const parsed = parseQuery(query)
  return parsed.excluded ? exclusionsOf(parsed, pokedex) : NO_EXCLUSIONS
}

/**
 * The text semantic search embeds: the query without its "not" / "no" segments, or '' when
 * nothing is left to search: a lone negation ("not electric") or a lone sort word ("the fastest
 * pokemon"), whose listed Pokémon would otherwise look weak enough to call the model.
 * A query without a negation goes as typed.
 */
export function semanticQueryOf(query: string): string {
  const parsed = parseQuery(query)
  if (!parsed.parts.length) {
    return ''
  }
  return parsed.excluded ? parsed.normalizedQuery : query
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
  pokedex: PokedexIndex,
): SearchResult[] {
  const results = searchableItems(pokedex)
    .filter((searchable) => !parsed.sort || searchable.kind === 'pokemon')
    .map((searchable) => ({
      ...searchable,
      ...scoreItem(parsed, searchable, pokedex),
    }))
    .map((result) =>
      parsed.kinds && !parsed.kinds.includes(result.kind)
        ? { ...result, score: result.score * OTHER_KIND_WEIGHT }
        : result,
    )
    .filter((result) => result.score > 0)
  return withEvolutionFamilies(results, pokedex, parsed.family)
}

/** A lone sort word: its name matches first, then every other Pokémon, each listed once. */
function sortWordResults(sort: Sort, pokedex: PokedexIndex): SearchResult[] {
  // "slow" can mean Slowpoke, but a phrase is never a name: "most attack" would be read as a
  // typo of Horn Attack.
  const nameMatches = sort.word.includes(' ')
    ? []
    : matchingResults(
        {
          parts: [{ kind: 'word', text: sort.word }],
          normalizedQuery: sort.word,
        },
        pokedex,
      )
  const found = new Set(nameMatches.map((result) => result.item.name))
  return [...nameMatches, ...listedItems(pokedex, ['pokemon'], found)]
}

/** Every item of these kinds not already found, in Pokédex order, below any real match. */
function listedItems(
  pokedex: PokedexIndex,
  kinds: ResultKind[],
  found: Set<string>,
): SearchResult[] {
  return searchableItems(pokedex)
    .filter(
      (searchable) =>
        kinds.includes(searchable.kind) && !found.has(searchable.item.name),
    )
    .map((searchable) => ({ ...searchable, score: LISTED_SCORE, matched: [] }))
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
