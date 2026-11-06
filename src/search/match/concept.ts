import type { PokedexIndex, Pokemon } from '../../data/types/model'
import { tagOf } from '../concepts/dictionary'
import { CONCEPT_BY_ID } from '../concepts/seed'
import type { Concept, ConceptId } from '../concepts/types'
import {
  BELOW_BEST_RELATED,
  CONCEPT_CHANCE,
  CONCEPT_COPIES,
  CONCEPT_NAME_BONUS,
  CONCEPT_STATED,
  EXTRA_RELATED_BONUS,
  MAX_EXTRA_RELATED,
  RELATED_WEIGHT,
  WEATHER_SCORES,
} from '../scores'
import type { Match, Scored, SearchableItem } from '../types/result'

type Tag = NonNullable<ReturnType<typeof tagOf>>

type MoveOrAbility = Exclude<SearchableItem, { kind: 'pokemon' }>

interface Related {
  kind: Tag['kind']
  name: string
  tag: Tag
  score: number
}

interface GroupRules {
  /** 0 for a direction search doesn't use. */
  score: (tag: Tag) => number
  /** What a move or ability result shows. */
  ownMatch: (tag: Tag, item: MoveOrAbility['item']) => Match
  /** What a Pokémon result shows for one of its moves or abilities. */
  relatedMatch: (related: Related, pokedex: PokedexIndex) => Match
}

// "Has a chance to…": the effect may not happen.
const CHANCE_WORDING = /\bchance\b/i

// A status condition counts only when inflicted (or passed on), and shows the short effect.
// Weather ranks what starts it, then benefits, then is affected, and shows the
// sentence about it with the direction.
const GROUPS: Record<Concept['group'], GroupRules> = {
  statusCondition: {
    score: (tag) => {
      switch (tag.direction) {
        case 'inflicts':
          return CHANCE_WORDING.test(tag.evidence)
            ? CONCEPT_CHANCE
            : CONCEPT_STATED
        case 'copies':
          return CONCEPT_COPIES
        default:
          return 0
      }
    },
    ownMatch: (_tag, item) => ({ field: 'effect', value: item.shortEffect }),
    relatedMatch: ({ kind, name }, pokedex) => ({
      field: kind,
      value: name,
      detail: (kind === 'move' ? pokedex.moves : pokedex.abilities).get(name)
        ?.shortEffect,
    }),
  },
  weather: {
    score: (tag) => WEATHER_SCORES[tag.direction] ?? 0,
    ownMatch: (tag) => ({
      field: 'effect',
      value: tag.evidence,
      direction: tag.direction,
    }),
    relatedMatch: ({ kind, name, tag }) => ({
      field: kind,
      value: name,
      detail: tag.evidence,
      direction: tag.direction,
    }),
  },
}

const NO_MATCH: Scored = { score: 0, matched: [] }

export function isWantedDirection(concept: ConceptId, tag: Tag): boolean {
  return GROUPS[CONCEPT_BY_ID[concept].group].score(tag) > 0
}

/** A Pokémon relates through its moves and abilities; `word` is the word as typed, looked for in the names. */
export function matchConcept(
  concept: ConceptId,
  searchable: SearchableItem,
  pokedex: PokedexIndex,
  word: string,
): Scored {
  const rules = GROUPS[CONCEPT_BY_ID[concept].group]
  return searchable.kind === 'pokemon'
    ? matchPokemon(concept, searchable.item, rules, pokedex, word)
    : matchMoveOrAbility(concept, searchable, rules, word)
}

function matchMoveOrAbility(
  concept: ConceptId,
  { kind, item }: MoveOrAbility,
  rules: GroupRules,
  word: string,
): Scored {
  const tag = tagOf(concept, kind, item.name)
  const score = tag ? tagScore(tag, item.searchName, rules, word) : 0
  return tag && score > 0
    ? { score, matched: [rules.ownMatch(tag, item)] }
    : NO_MATCH
}

function matchPokemon(
  concept: ConceptId,
  pokemon: Pokemon,
  rules: GroupRules,
  pokedex: PokedexIndex,
  word: string,
): Scored {
  const related = relatedOf(concept, pokemon, rules, pokedex, word)
  if (!related.length) {
    return NO_MATCH
  }
  const best = related[0].score
  const extra = Math.min(related.length - 1, MAX_EXTRA_RELATED)
  return {
    score: Math.min(
      best * RELATED_WEIGHT + extra * EXTRA_RELATED_BONUS,
      best - BELOW_BEST_RELATED,
    ),
    matched: related.map((r) => rules.relatedMatch(r, pokedex)),
  }
}

/** Best first. */
function relatedOf(
  concept: ConceptId,
  pokemon: Pokemon,
  rules: GroupRules,
  pokedex: PokedexIndex,
  word: string,
): Related[] {
  return [
    ...pokemon.moves.map((name) => ({ kind: 'move' as const, name })),
    ...pokemon.abilities.map((name) => ({ kind: 'ability' as const, name })),
  ]
    .flatMap(({ kind, name }) => {
      const tag = tagOf(concept, kind, name)
      const item = (kind === 'move' ? pokedex.moves : pokedex.abilities).get(
        name,
      )
      const score =
        tag && item ? tagScore(tag, item.searchName, rules, word) : 0
      return tag && score > 0 ? [{ kind, name, tag, score }] : []
    })
    .sort((a, b) => b.score - a.score)
}

function tagScore(
  tag: Tag,
  searchName: string,
  rules: GroupRules,
  word: string,
): number {
  const score = rules.score(tag)
  return score > 0 && searchName.split(' ').includes(word)
    ? score + CONCEPT_NAME_BONUS
    : score
}
