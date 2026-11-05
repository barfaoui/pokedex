import { CORRECTIONS } from './corrections'
import { GENERATED_TAGS } from './generated'
import {
  DIRECTIONS,
  type ConceptId,
  type Concepts,
  type Correction,
  type Direction,
  type GeneratedTag,
} from './types'

type ByDirection = Record<Direction, GeneratedTag[]>

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
