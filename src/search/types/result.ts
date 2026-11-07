import {
  STAT_NAMES,
  type Ability,
  type Move,
  type Pokemon,
} from '../../data/types/model'
import type { Direction } from '../concepts/types'

export type SearchableItem =
  | { kind: 'pokemon'; item: Pokemon }
  | { kind: 'move'; item: Move }
  | { kind: 'ability'; item: Ability }

export type ResultKind = SearchableItem['kind']

export type SearchResult = SearchableItem & Scored

export interface Scored {
  score: number
  matched: Match[]
}

export interface Match {
  field: MatchField
  value: string | number
  detail?: string
  direction?: Direction
}

export const MATCH_FIELDS = [
  'name',
  'type',
  'ability',
  'move',
  'color',
  'shape',
  'habitat',
  'genus',
  'legendary',
  'mythical',
  'description',
  'effect',
  'height',
  'weight',
  'total',
  'number',
  'evolutionOf',
  'evolvesInto',
  // An Ask AI answer. Never produced by the search itself.
  'ai',
  ...STAT_NAMES,
] as const

export type MatchField = (typeof MATCH_FIELDS)[number]
