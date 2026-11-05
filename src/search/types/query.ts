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
  /** Asks which Pokémon learn a move or have an ability ("who can learn surf"). */
  learners?: boolean
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
  stat: ConditionStat
  comparison: Comparison
  value: number
}

export type StatCriterion = StatName | 'total'

/** Weight in kg and height in m, as in the data. */
export type ConditionStat = StatCriterion | 'weight' | 'height'

/** "about": a bare measure ("90kg"), the closer the better. */
export type Comparison = 'over' | 'under' | 'atLeast' | 'atMost' | 'about'

export interface Sort {
  word: string
  attribute: SortAttribute
  direction: 'asc' | 'desc'
}

export type SortAttribute = ConditionStat | 'hpAndDefense'
