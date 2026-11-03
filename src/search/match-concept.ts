import type { PokedexIndex } from '../data/types/model'
import { inflictorsOf } from './concepts/dictionary.ts'
import type { ConceptId } from './concepts/types.ts'
import type { Match, Scored, SearchableItem } from './types/result'

const NO_MATCH: Scored = { score: 0, matched: [] }

/**
 * 1 when the item causes the concept: a move or ability tagged "inflicts",
 * or a Pokémon with such a move or ability (read from the Pokémon's own
 * lists). Shows the effect, or the moves and abilities with their effect.
 */
export function matchConcept(
  concept: ConceptId,
  searchable: SearchableItem,
  pokedex: PokedexIndex,
): Scored {
  const inflictors = inflictorsOf(concept)
  switch (searchable.kind) {
    case 'move':
      return inflictors.moves.has(searchable.item.name)
        ? effectMatch(searchable.item.shortEffect)
        : NO_MATCH
    case 'ability':
      return inflictors.abilities.has(searchable.item.name)
        ? effectMatch(searchable.item.shortEffect)
        : NO_MATCH
    case 'pokemon': {
      const matched: Match[] = [
        ...searchable.item.moves
          .filter((name) => inflictors.moves.has(name))
          .map((name) => ({
            field: 'move' as const,
            value: name,
            detail: pokedex.moves.get(name)?.shortEffect,
          })),
        ...searchable.item.abilities
          .filter((name) => inflictors.abilities.has(name))
          .map((name) => ({
            field: 'ability' as const,
            value: name,
            detail: pokedex.abilities.get(name)?.shortEffect,
          })),
      ]
      return matched.length ? { score: 1, matched } : NO_MATCH
    }
  }
}

function effectMatch(shortEffect: string): Scored {
  return { score: 1, matched: [{ field: 'effect', value: shortEffect }] }
}
