import { STAT_NAMES, type Pokemon, type StatName } from '@/data/types/model'

const POCKETS_PER_PAGE = 6
const STATS_SHOWN = 2

const SHORT_LABELS: Record<StatName, string> = {
  hp: 'HP',
  attack: 'Atk',
  defense: 'Def',
  'special-attack': 'SpA',
  'special-defense': 'SpD',
  speed: 'Spd',
}

export interface AlbumStat {
  label: string
  value: number
}

export function albumStats(pokemon: Pokemon): AlbumStat[] {
  return [...STAT_NAMES]
    .sort((a, b) => pokemon.stats[b] - pokemon.stats[a])
    .slice(0, STATS_SHOWN)
    .map((stat) => ({ label: SHORT_LABELS[stat], value: pokemon.stats[stat] }))
}

/** Whole album pages, so the empty pockets of the last page stay visible. */
export function pocketCount(favourites: number): number {
  return (
    Math.max(1, Math.ceil(favourites / POCKETS_PER_PAGE)) * POCKETS_PER_PAGE
  )
}
