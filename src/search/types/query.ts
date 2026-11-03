import type {
  Color,
  Habitat,
  PokemonType,
  Shape,
  StatName,
} from '../../data/types/model'

export interface ParsedQuery {
  parts: QueryPart[]
  sort?: Sort
}

export type QueryPart = WordPart | StatPart

export interface WordPart {
  kind: 'word'
  text: string
  type?: { value: PokemonType; score: number }
  descriptor?: Descriptor
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
