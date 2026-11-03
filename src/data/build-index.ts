import type { PokedexIndex } from './types/model'
import type { RawDataset } from './types/raw-data'

export function buildIndex(_raw: RawDataset): PokedexIndex {
  return { pokemon: new Map(), moves: new Map(), abilities: new Map() }
}
