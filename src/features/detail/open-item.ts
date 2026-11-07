import type { Match, ResultKind } from '@/search/types/result'

export interface OpenItem {
  kind: ResultKind
  name: string
  matched: Match[]
  /** 0–1; 1 is an exact match. */
  score: number
}

export function linkedItem(kind: ResultKind, name: string): OpenItem {
  return { kind, name, matched: [], score: 0 }
}
