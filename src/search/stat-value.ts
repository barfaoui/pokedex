import { STAT_NAMES, type Pokemon } from '../data/types/model'
import type { StatCriterion } from './types/query'

export function statValue(pokemon: Pokemon, stat: StatCriterion): number {
  if (stat === 'total') {
    return STAT_NAMES.reduce((sum, name) => sum + pokemon.stats[name], 0)
  }
  return pokemon.stats[stat]
}
