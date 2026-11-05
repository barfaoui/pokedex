import type {
  Color,
  Habitat,
  PokemonType,
  Shape,
  StatName,
} from '../../data/types/model'
import type { ConceptId } from '../concepts/types'
import type { ResultKind } from './result'

export interface ParsedQuery {
  parts: QueryPart[]
  sort?: Sort
  /** Every word typed, normalised, before filler words are dropped ("double team"). */
  normalizedQuery: string
  kinds?: ResultKind[]
  excluded?: string[][]
  /** Set when the query asks for a Pokémon's family: the relatives it asks for first. */
  family?: FamilyDirection
}

export type FamilyDirection = 'later' | 'earlier' | 'last'

export type QueryPart = WordPart | StatPart

export interface WordPart {
  kind: 'word'
  text: string
  type?: { value: PokemonType; score: number }
  descriptor?: { value: Descriptor; score: number }
  concept?: ConceptId
  number?: number
}

export type Descriptor =
  | { field: 'color'; value: Color }
  | { field: 'shape'; value: Shape }
  | { field: 'habitat'; value: Habitat }

export interface StatPart {
  kind: 'stat'
  stat: StatCriterion
  comparison: Comparison
  value: number
}

export type StatCriterion = StatName | 'total'

export type Comparison = 'over' | 'under' | 'atLeast' | 'atMost'

export interface Sort {
  word: string
  attribute: SortAttribute
  direction: 'asc' | 'desc'
}

export type SortAttribute = StatCriterion | 'weight' | 'height' | 'hpAndDefense'
