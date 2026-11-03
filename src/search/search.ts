import { index } from '../data/dataset'
import type { PokedexIndex } from '../data/types/model'
import type { SearchResult } from './types'

export function search(
  _query: string,
  _pokedex: PokedexIndex = index,
): SearchResult[] {
  return []
}
