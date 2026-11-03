import { buildIndex } from './build-index'
import raw from './pokedex.json'
import type { RawDataset } from './types/raw-data'

export const dataset = raw as RawDataset

export const index = buildIndex(dataset)
