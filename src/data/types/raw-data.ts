export type StatName =
  'hp' | 'attack' | 'defense' | 'special-attack' | 'special-defense' | 'speed'

export interface RawPokemon {
  id: number
  name: string
  height_decimetres: number
  weight_hectograms: number
  base_experience: number
  types: string[]
  stats: Record<StatName, number>
  abilities: string[]
  moves: string[]
  species: {
    generation: string
    description: string
    genus: string
    color: string
    shape: string
    habitat: string
    is_legendary: boolean
    is_mythical: boolean
    evolution_chain_id: number
  }
  images: {
    sprite: string
    official_artwork: string
  }
}

export interface RawMove {
  id: number
  name: string
  type: string
  power: number | null
  pp: number
  accuracy: number | null
  priority: number
  damage_class: string
  effect_chance: number | null
  effect: string
  short_effect: string
  generation: string
  learned_by_pokemon: string[]
}

export interface RawAbility {
  id: number
  name: string
  effect: string
  short_effect: string
  generation: string
  is_main_series: boolean
  pokemon: string[]
}

export interface RawDataset {
  metadata: {
    schema_version: number
    source: string
    scope: string
    version_groups: string[]
  }
  pokemon: RawPokemon[]
  moves: RawMove[]
  abilities: RawAbility[]
}
