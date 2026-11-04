export const POKEMON_TYPES = [
  'normal',
  'fire',
  'water',
  'electric',
  'grass',
  'ice',
  'fighting',
  'poison',
  'ground',
  'flying',
  'psychic',
  'bug',
  'rock',
  'ghost',
  'dragon',
  'dark',
  'steel',
  'fairy',
] as const

export type PokemonType = (typeof POKEMON_TYPES)[number]

export const STAT_NAMES = [
  'hp',
  'attack',
  'defense',
  'special-attack',
  'special-defense',
  'speed',
] as const

export type StatName = (typeof STAT_NAMES)[number]

export const COLORS = [
  'black',
  'blue',
  'brown',
  'gray',
  'green',
  'pink',
  'purple',
  'red',
  'white',
  'yellow',
] as const

export type Color = (typeof COLORS)[number]

export const SHAPES = [
  'arms',
  'armor',
  'ball',
  'blob',
  'bug-wings',
  'fish',
  'heads',
  'humanoid',
  'legs',
  'quadruped',
  'squiggle',
  'tentacles',
  'upright',
  'wings',
] as const

export type Shape = (typeof SHAPES)[number]

export const HABITATS = [
  'cave',
  'forest',
  'grassland',
  'mountain',
  'rare',
  'rough-terrain',
  'sea',
  'urban',
  'waters-edge',
] as const

export type Habitat = (typeof HABITATS)[number]

export const DAMAGE_CLASSES = ['physical', 'special', 'status'] as const

export type DamageClass = (typeof DAMAGE_CLASSES)[number]

export interface PokedexIndex {
  pokemon: Map<string, Pokemon>
  moves: Map<string, Move>
  abilities: Map<string, Ability>
}

export interface Pokemon {
  id: number
  name: string
  displayName: string
  searchName: string
  types: PokemonType[]
  stats: Record<StatName, number>
  heightM: number
  weightKg: number
  baseExperience: number
  abilities: string[]
  moves: string[]
  genus: string
  description: string
  color: Color | undefined
  shape: Shape | undefined
  habitat: Habitat | undefined
  isLegendary: boolean
  isMythical: boolean
  evolution: Evolution | undefined
  sprite: string
  artwork: string
}

export interface Evolution {
  chainId: number
  members: string[]
  /** In order; a stage with several members is a branch (Eevee's evolutions). */
  stages: string[][]
}

export interface Move {
  name: string
  displayName: string
  searchName: string
  type: PokemonType | undefined
  power: number | null
  pp: number
  accuracy: number | null
  priority: number
  damageClass: DamageClass | undefined
  effectChance: number | null
  effect: string
  shortEffect: string
  learnedBy: string[]
}

export interface Ability {
  name: string
  displayName: string
  searchName: string
  effect: string
  shortEffect: string
  isMainSeries: boolean
  pokemon: string[]
}
