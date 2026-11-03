import {
  STAT_NAMES,
  type Ability,
  type Move,
  type Pokemon,
} from '../data/types/model'

export const MATCH_FIELDS = [
  'name',
  'type',
  'ability',
  'move',
  'color',
  'shape',
  'habitat',
  'description',
  'height',
  'weight',
  'total',
  ...STAT_NAMES,
] as const

export type MatchField = (typeof MATCH_FIELDS)[number]

export interface Match {
  field: MatchField
  value: string | number
}

export type SearchableItem =
  | { kind: 'pokemon'; item: Pokemon }
  | { kind: 'move'; item: Move }
  | { kind: 'ability'; item: Ability }

export type ResultKind = SearchableItem['kind']

export type SearchResult = SearchableItem & {
  score: number
  matched: Match[]
}
