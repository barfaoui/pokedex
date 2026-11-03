import type { PokedexIndex, Pokemon } from '../../data/types/model'
import { tagOf } from '../concepts/dictionary'
import { CONCEPT_BY_ID } from '../concepts/seed'
import type { Concept, ConceptId, Direction } from '../concepts/types'
import type { Match, Scored, SearchableItem } from '../types/result'

type Tag = NonNullable<ReturnType<typeof tagOf>>

type MoveOrAbility = Exclude<SearchableItem, { kind: 'pokemon' }>

interface Related {
  kind: Tag['kind']
  name: string
  tag: Tag
  score: number
}

/** How a concept group is scored and shown. */
interface GroupRules {
  /** The directions search uses, and their scores. */
  scores: Partial<Record<Direction, number>>
  /** What a move or ability result shows. */
  ownMatch: (tag: Tag, item: MoveOrAbility['item']) => Match
  /** What a Pokémon result shows for one of its moves or abilities. */
  relatedMatch: (related: Related, pokedex: PokedexIndex) => Match
}

// A status condition counts only when inflicted, and shows the short effect. Weather
// ranks what starts it, then benefits, then is affected, and shows the
// sentence about it with the direction.
const GROUPS: Record<Concept['group'], GroupRules> = {
  statusCondition: {
    scores: { inflicts: 1 },
    ownMatch: (_tag, item) => ({ field: 'effect', value: item.shortEffect }),
    relatedMatch: ({ kind, name }, pokedex) => ({
      field: kind,
      value: name,
      detail: (kind === 'move' ? pokedex.moves : pokedex.abilities).get(name)
        ?.shortEffect,
    }),
  },
  weather: {
    scores: { starts: 1, benefits: 0.9, affected: 0.8 },
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

/**
 * How well an item relates to a concept: a move or ability through its own
 * tag, a Pokémon through the best of its moves and abilities (read from the
 * Pokémon's own lists).
 */
export function matchConcept(
  concept: ConceptId,
  searchable: SearchableItem,
  pokedex: PokedexIndex,
): Scored {
  const rules = GROUPS[CONCEPT_BY_ID[concept].group]
  return searchable.kind === 'pokemon'
    ? matchPokemon(concept, searchable.item, rules, pokedex)
    : matchMoveOrAbility(concept, searchable, rules)
}

function matchMoveOrAbility(
  concept: ConceptId,
  { kind, item }: MoveOrAbility,
  rules: GroupRules,
): Scored {
  const tag = tagOf(concept, kind, item.name)
  const score = tag ? (rules.scores[tag.direction] ?? 0) : 0
  return tag && score > 0
    ? { score, matched: [rules.ownMatch(tag, item)] }
    : NO_MATCH
}

function matchPokemon(
  concept: ConceptId,
  pokemon: Pokemon,
  rules: GroupRules,
  pokedex: PokedexIndex,
): Scored {
  const related = relatedOf(concept, pokemon, rules)
  return related.length
    ? {
        score: related[0].score,
        matched: related.map((r) => rules.relatedMatch(r, pokedex)),
      }
    : NO_MATCH
}

/** The Pokémon's moves and abilities that relate to the concept, best first. */
function relatedOf(
  concept: ConceptId,
  pokemon: Pokemon,
  rules: GroupRules,
): Related[] {
  return [
    ...pokemon.moves.map((name) => ({ kind: 'move' as const, name })),
    ...pokemon.abilities.map((name) => ({ kind: 'ability' as const, name })),
  ]
    .flatMap(({ kind, name }) => {
      const tag = tagOf(concept, kind, name)
      const score = tag ? (rules.scores[tag.direction] ?? 0) : 0
      return tag && score > 0 ? [{ kind, name, tag, score }] : []
    })
    .sort((a, b) => b.score - a.score)
}
