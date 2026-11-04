import {
  STAT_NAMES,
  type Pokemon,
  type PokemonType,
  type StatName,
} from '@/data/types/model'
import { statTotal } from '@/features/results/stat-scale'

export interface StatComparison {
  stat: StatName | 'total'
  left: number
  right: number
  higher: 'left' | 'right' | 'tie'
}

export interface SharedTraits {
  types: PokemonType[]
  abilities: string[]
}

export function compareStats(left: Pokemon, right: Pokemon): StatComparison[] {
  const rows = STAT_NAMES.map((stat) =>
    comparison(stat, left.stats[stat], right.stats[stat]),
  )
  return [...rows, comparison('total', statTotal(left), statTotal(right))]
}

export function sharedTraits(left: Pokemon, right: Pokemon): SharedTraits {
  return {
    types: left.types.filter((type) => right.types.includes(type)),
    abilities: left.abilities.filter((ability) =>
      right.abilities.includes(ability),
    ),
  }
}

function comparison(
  stat: StatComparison['stat'],
  left: number,
  right: number,
): StatComparison {
  const higher = left > right ? 'left' : left < right ? 'right' : 'tie'
  return { stat, left, right, higher }
}
