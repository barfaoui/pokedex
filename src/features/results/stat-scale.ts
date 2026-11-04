import { index } from '@/data/dataset'
import { STAT_NAMES, type Pokemon, type StatName } from '@/data/types/model'

export type ScaledStat = StatName | 'total'

export function statScale(pokemon: Pokemon[]): Record<ScaledStat, number> {
  const highest = (value: (pokemon: Pokemon) => number) =>
    Math.max(...pokemon.map(value))
  const scale = Object.fromEntries(
    STAT_NAMES.map((stat) => [stat, highest((p) => p.stats[stat])]),
  ) as Record<StatName, number>
  return { ...scale, total: highest(statTotal) }
}

export function statTotal(pokemon: Pokemon): number {
  return STAT_NAMES.reduce((sum, stat) => sum + pokemon.stats[stat], 0)
}

// The strongest of the 151 fills its bar, so differences show even for low stats.
export const STAT_SCALE = statScale([...index.pokemon.values()])
