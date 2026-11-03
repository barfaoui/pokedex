export type ConceptId =
  | 'sleep'
  | 'paralysis'
  | 'poison'
  | 'burn'
  | 'freeze'
  | 'confusion'
  | 'flinch'
  | 'rain'
  | 'sun'
  | 'sandstorm'
  | 'hail'

export interface Concept {
  id: ConceptId
  group: 'status' | 'weather'
  /** Forms found in the effect texts, matched as whole words. */
  roots: string[]
  /** What a user might type for it, roots included. */
  words: string[]
}

/** In review order: what search uses first, noise last. */
export const DIRECTIONS = [
  'inflicts',
  'starts',
  'benefits',
  'affected',
  'prevents',
  'self',
  'unclear',
] as const

export type Direction = (typeof DIRECTIONS)[number]

export interface ConceptTag {
  concept: ConceptId
  kind: 'move' | 'ability'
  name: string
  direction: Direction
  evidence: string
  source: 'short_effect' | 'effect'
}

export type GeneratedTag = Omit<ConceptTag, 'concept' | 'direction'>

export type Concepts = Record<ConceptId, Record<Direction, GeneratedTag[]>>

export type Correction = Pick<GeneratedTag, 'kind' | 'name'>

/** Same grouping as Concepts; a correction sits under its corrected direction. */
export type Corrections = Partial<
  Record<ConceptId, Partial<Record<Direction, Correction[]>>>
>
