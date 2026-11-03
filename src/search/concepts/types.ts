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
  'affected',
  'prevents',
  'self',
  'unclear',
  'mentions',
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

/** The generated output, grouped for review: concept → direction → tags. */
export type GeneratedConcepts = Record<
  ConceptId,
  Record<Direction, GeneratedTag[]>
>

export interface ConceptCorrection {
  concept: ConceptId
  kind: 'move' | 'ability'
  name: string
  direction: Direction
  reason: string
}
