import type { PokedexIndex } from '../data/types/model'
import { matchConcept } from './match/concept'
import { nameScore } from './match/name'
import { statValue } from './stat-value'
import type { ParsedQuery, QueryPart, StatPart, WordPart } from './types/query'
import type { Scored, SearchableItem } from './types/result'

// A missed stat condition keeps a score for how close it was, unless the value is under half the threshold.
const NEAR_MISS_WEIGHT = 0.95
const MIN_NEAR_MISS_RATIO = 0.5

const NO_MATCH: Scored = { score: 0, matched: [] }

/**
 * How well an item meets the query: the average of its part scores,
 * with what each matching part matched on. Expects at least one part.
 */
export function scoreItem(
  query: ParsedQuery,
  searchable: SearchableItem,
  pokedex: PokedexIndex,
): Scored {
  const alone = query.parts.length === 1
  const parts = query.parts.map((part) =>
    scorePart(part, searchable, pokedex, alone),
  )
  const average = {
    score: parts.reduce((sum, part) => sum + part.score, 0) / parts.length,
    matched: parts.flatMap((part) => part.matched),
  }
  const phrase = scorePhrase(query.normalizedQuery, searchable)
  return phrase.score > average.score ? phrase : average
}

function scorePart(
  part: QueryPart,
  searchable: SearchableItem,
  pokedex: PokedexIndex,
  alone: boolean,
): Scored {
  return part.kind === 'stat'
    ? scoreStat(part, searchable)
    : scoreWord(part, searchable, pokedex, alone)
}

/**
 * Multi-word names ("mr mime", "double team") are also matched against the
 * whole query as typed, filler words included.
 */
function scorePhrase(
  normalizedQuery: string,
  searchable: SearchableItem,
): Scored {
  return normalizedQuery.includes(' ')
    ? scoreName(normalizedQuery, searchable)
    : NO_MATCH
}

/**
 * A word can mean a concept, a name, a type or a descriptor; the best counts.
 * The concept comes first, so on a tie the effect is shown.
 */
function scoreWord(
  part: WordPart,
  searchable: SearchableItem,
  pokedex: PokedexIndex,
  alone: boolean,
): Scored {
  return [
    part.concept
      ? matchConcept(part.concept, searchable, pokedex, part.text)
      : NO_MATCH,
    // A concept word ("rain") only matches names from the start: never "Mega Drain".
    scoreName(part.text, searchable, {
      anywhere: !part.concept,
      shortPrefix: alone,
    }),
    scoreType(part, searchable),
    scoreDescriptor(part, searchable),
  ].reduce((best, candidate) =>
    candidate.score > best.score ? candidate : best,
  )
}

/** Pokémon only: 1 when the condition is met, otherwise its near-miss score. */
function scoreStat(part: StatPart, searchable: SearchableItem): Scored {
  if (searchable.kind !== 'pokemon') {
    return NO_MATCH
  }
  const value = statValue(searchable.item, part.stat)
  const score = isMet(part, value) ? 1 : nearMissScore(part, value)
  return score > 0
    ? { score, matched: [{ field: part.stat, value }] }
    : NO_MATCH
}

function scoreName(
  text: string,
  searchable: SearchableItem,
  options?: { anywhere?: boolean; shortPrefix?: boolean },
): Scored {
  const score = nameScore(text, searchable.item.searchName, options)
  return score > 0
    ? { score, matched: [{ field: 'name', value: searchable.item.name }] }
    : NO_MATCH
}

function scoreType(part: WordPart, searchable: SearchableItem): Scored {
  if (!part.type) {
    return NO_MATCH
  }
  const types =
    searchable.kind === 'pokemon'
      ? searchable.item.types
      : searchable.kind === 'move'
        ? [searchable.item.type]
        : []
  return types.includes(part.type.value)
    ? {
        score: part.type.score,
        matched: [{ field: 'type', value: part.type.value }],
      }
    : NO_MATCH
}

function scoreDescriptor(part: WordPart, searchable: SearchableItem): Scored {
  const { descriptor } = part
  if (!descriptor || searchable.kind !== 'pokemon') {
    return NO_MATCH
  }
  return searchable.item[descriptor.field] === descriptor.value
    ? { score: 1, matched: [descriptor] }
    : NO_MATCH
}

function isMet({ comparison, value: threshold }: StatPart, value: number) {
  switch (comparison) {
    case 'over':
      return value > threshold
    case 'atLeast':
      return value >= threshold
    case 'under':
      return value < threshold
    case 'atMost':
      return value <= threshold
  }
}

/** 0.95 × how close the value came (value ÷ threshold, inverted for "under"), or 0 below half. */
function nearMissScore(
  { comparison, value: threshold }: StatPart,
  value: number,
) {
  const wantsMore = comparison === 'over' || comparison === 'atLeast'
  const ratio = wantsMore ? value / threshold : threshold / value
  return ratio >= MIN_NEAR_MISS_RATIO ? NEAR_MISS_WEIGHT * ratio : 0
}
