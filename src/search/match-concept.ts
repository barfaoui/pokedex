import type { PokedexIndex } from '../data/types/model'
import { tagOf } from './concepts/dictionary.ts'
import { CONCEPTS } from './concepts/seed.ts'
import type { ConceptId, Direction } from './concepts/types.ts'
import type { Match, Scored, SearchableItem } from './types/result'

type Tag = NonNullable<ReturnType<typeof tagOf>>

// The directions search uses, and their scores: a status counts only when
// inflicted; weather ranks what starts it, then benefits, then is affected.
const SCORES: Record<
  'status' | 'weather',
  Partial<Record<Direction, number>>
> = {
  status: { inflicts: 1 },
  weather: { starts: 1, benefits: 0.9, affected: 0.8 },
}

const NO_MATCH: Scored = { score: 0, matched: [] }

/**
 * How well an item relates to a concept: a move or ability through its own
 * tag, a Pokémon through the best of its moves and abilities (read from the
 * Pokémon's own lists). Statuses show the short effect; weather shows the
 * sentence about it and the direction.
 */
export function matchConcept(
  concept: ConceptId,
  searchable: SearchableItem,
  pokedex: PokedexIndex,
): Scored {
  const isWeather = groupOf(concept) === 'weather'
  if (searchable.kind !== 'pokemon') {
    const tag = scoredTag(concept, searchable.kind, searchable.item.name)
    return tag
      ? {
          score: scoreOf(concept, tag),
          matched: [
            isWeather
              ? {
                  field: 'effect',
                  value: tag.evidence,
                  direction: tag.direction,
                }
              : { field: 'effect', value: searchable.item.shortEffect },
          ],
        }
      : NO_MATCH
  }
  const related = [
    ...searchable.item.moves.map((name) => ({ kind: 'move' as const, name })),
    ...searchable.item.abilities.map((name) => ({
      kind: 'ability' as const,
      name,
    })),
  ].flatMap(({ kind, name }) => {
    const tag = scoredTag(concept, kind, name)
    return tag ? [{ kind, name, tag, score: scoreOf(concept, tag) }] : []
  })
  if (!related.length) {
    return NO_MATCH
  }
  return {
    score: Math.max(...related.map((r) => r.score)),
    matched: related
      .sort((a, b) => b.score - a.score)
      .map(({ kind, name, tag }): Match =>
        isWeather
          ? {
              field: kind,
              value: name,
              detail: tag.evidence,
              direction: tag.direction,
            }
          : {
              field: kind,
              value: name,
              detail: shortEffectOf(kind, name, pokedex),
            },
      ),
  }
}

/** The item's tag for the concept, only in a direction search uses. */
function scoredTag(
  concept: ConceptId,
  kind: Tag['kind'],
  name: string,
): Tag | undefined {
  const tag = tagOf(concept, kind, name)
  return tag && scoreOf(concept, tag) > 0 ? tag : undefined
}

function scoreOf(concept: ConceptId, tag: Tag): number {
  return SCORES[groupOf(concept)][tag.direction] ?? 0
}

function groupOf(concept: ConceptId): 'status' | 'weather' {
  return CONCEPTS.find((c) => c.id === concept)?.group ?? 'status'
}

function shortEffectOf(
  kind: Tag['kind'],
  name: string,
  pokedex: PokedexIndex,
): string | undefined {
  return (kind === 'move' ? pokedex.moves : pokedex.abilities).get(name)
    ?.shortEffect
}
