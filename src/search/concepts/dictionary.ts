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

const TAGS_BY_ITEM = new Map(
  Object.entries(DICTIONARY).flatMap(([concept, byDirection]) =>
    DIRECTIONS.flatMap((direction) =>
      byDirection[direction].map((tag) => [
        itemKey(concept as ConceptId, tag.kind, tag.name),
        { ...tag, direction },
      ]),
    ),
  ),
)

/** How a move or ability relates to a concept, with its evidence; none if it doesn't. */
export function tagOf(
  concept: ConceptId,
  kind: GeneratedTag['kind'],
  name: string,
): (GeneratedTag & { direction: Direction }) | undefined {
  return TAGS_BY_ITEM.get(itemKey(concept, kind, name))
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

function itemKey(
  concept: ConceptId,
  kind: GeneratedTag['kind'],
  name: string,
): string {
  return `${concept}/${kind}/${name}`
}
