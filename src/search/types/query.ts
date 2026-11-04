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
  /** The kinds of result the query names ("pokemon that…"), ranked first. */
  kinds?: ResultKind[]
}

export type QueryPart = WordPart | StatPart

export interface WordPart {
  kind: 'word'
  text: string
  type?: { value: PokemonType; score: number }
  descriptor?: Descriptor
  concept?: ConceptId
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

export type SortAttribute =
  'speed' | 'attack' | 'total' | 'weight' | 'height' | 'hpAndDefense'
