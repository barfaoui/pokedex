import { CORRECTIONS } from './corrections.ts'
import { GENERATED_TAGS } from './generated.ts'
import {
  DIRECTIONS,
  type ConceptId,
  type Concepts,
  type Correction,
  type Direction,
  type GeneratedTag,
} from './types.ts'

type ByDirection = Record<Direction, GeneratedTag[]>

/** The concept dictionary: the generated tags, moved by the human corrections. */
export const DICTIONARY: Concepts = applyCorrections(
  GENERATED_TAGS,
  CORRECTIONS,
)

/** Names of the moves and abilities that cause a concept. */
export function inflictorsOf(concept: ConceptId): {
  moves: Set<string>
  abilities: Set<string>
} {
  const inflicting = DICTIONARY[concept].inflicts
  return {
    moves: namesOf(inflicting, 'move'),
    abilities: namesOf(inflicting, 'ability'),
  }
}

function applyCorrections(
  generated: Concepts,
  corrections: typeof CORRECTIONS,
): Concepts {
  return Object.fromEntries(
    Object.entries(generated).map(([concept, byDirection]) => [
      concept,
      correctConcept(byDirection, corrections[concept as ConceptId] ?? {}),
    ]),
  ) as Concepts
}

/** Moves each corrected tag from its generated direction to its corrected one. */
function correctConcept(
  byDirection: ByDirection,
  corrected: Partial<Record<Direction, Correction[]>>,
): ByDirection {
  const tags = DIRECTIONS.flatMap((direction) =>
    byDirection[direction].map((tag) => ({
      tag,
      direction: correctedDirection(tag, corrected) ?? direction,
    })),
  )
  return Object.fromEntries(
    DIRECTIONS.map((direction) => [
      direction,
      tags.filter((t) => t.direction === direction).map((t) => t.tag),
    ]),
  ) as ByDirection
}

function correctedDirection(
  tag: GeneratedTag,
  corrected: Partial<Record<Direction, Correction[]>>,
): Direction | undefined {
  return DIRECTIONS.find((direction) =>
    corrected[direction]?.some(
      (c) => c.kind === tag.kind && c.name === tag.name,
    ),
  )
}

function namesOf(
  tags: GeneratedTag[],
  kind: GeneratedTag['kind'],
): Set<string> {
  return new Set(tags.filter((tag) => tag.kind === kind).map((tag) => tag.name))
}
