import type { PokedexIndex, Pokemon } from '../data/types/model'
import { matchConcept } from './match/concept'
import { genusScore } from './match/genus'
import { nameScore } from './match/name'
import { statValue } from './stat-value'
import type {
  ConditionStat,
  ParsedQuery,
  QueryPart,
  StatPart,
  WordPart,
} from './types/query'
import { MIN_NEAR_MISS_RATIO, NEAR_MISS_WEIGHT } from './scores'
import { RARITY_WORDS } from './vocabulary'
import type { Scored, SearchableItem } from './types/result'

const NO_MATCH: Scored = { score: 0, matched: [] }

/** Expects at least one part. */
export function scoreItem(
  query: ParsedQuery,
  searchable: SearchableItem,
  pokedex: PokedexIndex,
): Scored {
  const alone = query.parts.length === 1
  const parts = query.parts.map((part) =>
    scorePart(part, searchable, pokedex, alone, !!query.learners),
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
  learners: boolean,
): Scored {
  return part.kind === 'stat'
    ? scoreStat(part, searchable)
    : scoreWord(part, searchable, pokedex, alone, learners)
}

// Multi-word names ("mr mime") are also matched against the whole query, filler words included.
function scorePhrase(
  normalizedQuery: string,
  searchable: SearchableItem,
): Scored {
  return normalizedQuery.includes(' ')
    ? scoreName(normalizedQuery, searchable)
    : NO_MATCH
}

// The best meaning counts; the concept comes first, so on a tie the effect is shown.
function scoreWord(
  part: WordPart,
  searchable: SearchableItem,
  pokedex: PokedexIndex,
  alone: boolean,
  learners: boolean,
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
    scoreGenus(part, searchable),
    scoreRarity(part, searchable),
    scoreNumber(part, searchable),
    learners ? scoreLearned(part, searchable, pokedex) : NO_MATCH,
  ].reduce((best, candidate) =>
    candidate.score > best.score ? candidate : best,
  )
}

function scoreStat(part: StatPart, searchable: SearchableItem): Scored {
  if (searchable.kind !== 'pokemon') {
    return NO_MATCH
  }
  const value = conditionValue(searchable.item, part.stat)
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

function scoreNumber(part: WordPart, searchable: SearchableItem): Scored {
  return part.number !== undefined &&
    searchable.kind === 'pokemon' &&
    searchable.item.id === part.number
    ? { score: 1, matched: [{ field: 'number', value: part.number }] }
    : NO_MATCH
}

function scoreDescriptor(part: WordPart, searchable: SearchableItem): Scored {
  const { descriptor } = part
  if (!descriptor || searchable.kind !== 'pokemon') {
    return NO_MATCH
  }
  return searchable.item[descriptor.value.field] === descriptor.value.value
    ? { score: descriptor.score, matched: [descriptor.value] }
    : NO_MATCH
}

/** Exact names only: "fire" must not bring every Pokémon that learns Fire Blast. */
function scoreLearned(
  part: WordPart,
  searchable: SearchableItem,
  pokedex: PokedexIndex,
): Scored {
  if (searchable.kind !== 'pokemon') {
    return NO_MATCH
  }
  const { moves, abilities } = searchable.item
  const move = moves.find(
    (name) => pokedex.moves.get(name)?.searchName === part.text,
  )
  if (move) {
    return { score: 1, matched: [{ field: 'move', value: move }] }
  }
  const ability = abilities.find(
    (name) => pokedex.abilities.get(name)?.searchName === part.text,
  )
  return ability
    ? { score: 1, matched: [{ field: 'ability', value: ability }] }
    : NO_MATCH
}

/** A concept word ("freeze") is read as the effect, never as a category ("Freeze Pokémon"). */
function scoreGenus(part: WordPart, searchable: SearchableItem): Scored {
  if (part.concept || searchable.kind !== 'pokemon') {
    return NO_MATCH
  }
  const score = genusScore(part.text, searchable.item.genus)
  return score > 0
    ? { score, matched: [{ field: 'genus', value: searchable.item.genus }] }
    : NO_MATCH
}

function scoreRarity(part: WordPart, searchable: SearchableItem): Scored {
  const rarity = RARITY_WORDS.get(part.text)
  if (!rarity || searchable.kind !== 'pokemon') {
    return NO_MATCH
  }
  const flagged =
    rarity === 'legendary'
      ? searchable.item.isLegendary
      : searchable.item.isMythical
  return flagged
    ? { score: 1, matched: [{ field: rarity, value: rarity }] }
    : NO_MATCH
}

function conditionValue(pokemon: Pokemon, stat: ConditionStat): number {
  switch (stat) {
    case 'weight':
      return pokemon.weightKg
    case 'height':
      return pokemon.heightM
    default:
      return statValue(pokemon, stat)
  }
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
    case 'about':
      return value === threshold
  }
}

function nearMissScore(
  { comparison, value: threshold }: StatPart,
  value: number,
) {
  const wantsMore = comparison === 'over' || comparison === 'atLeast'
  // Symmetric, so the closest measure ranks first whichever side it is on
  const ratio =
    comparison === 'about'
      ? 1 - Math.abs(value - threshold) / threshold
      : wantsMore
        ? value / threshold
        : threshold / value
  return ratio >= MIN_NEAR_MISS_RATIO ? NEAR_MISS_WEIGHT * ratio : 0
}
