import { STAT_NAMES } from '../data/types/model'

export type ResultKind = 'pokemon' | 'move' | 'ability'

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

export interface SearchResult {
  kind: ResultKind
  name: string
  score: number
  matched: Match[]
}
