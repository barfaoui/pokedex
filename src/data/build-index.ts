import { displayName } from './display-name'
import { normalize } from '../text/normalize'
import {
  COLORS,
  DAMAGE_CLASSES,
  HABITATS,
  POKEMON_TYPES,
  SHAPES,
  type Ability,
  type Evolution,
  type Move,
  type PokedexIndex,
  type Pokemon,
} from './types/model'
import type {
  RawAbility,
  RawDataset,
  RawMove,
  RawPokemon,
} from './types/raw-data'

export function buildIndex(raw: RawDataset): PokedexIndex {
  // Links come from the Pokémon side only; the raw reverse lists are ignored.
  const groupedByMove = groupPokemonBy(raw.pokemon, (p) => p.moves)
  const groupedByAbility = groupPokemonBy(raw.pokemon, (p) => p.abilities)
  const evolutions = groupEvolutions(raw.pokemon)

  return {
    pokemon: new Map(
      raw.pokemon.map((p) => [p.name, toPokemon(p, evolutions)]),
    ),
    moves: new Map(
      raw.moves.map((m) => [
        m.name,
        toMove(m, groupedByMove.get(m.name) ?? []),
      ]),
    ),
    abilities: new Map(
      raw.abilities.map((a) => [
        a.name,
        toAbility(a, groupedByAbility.get(a.name) ?? []),
      ]),
    ),
  }
}

function toPokemon(p: RawPokemon, evolutions: Map<number, Evolution>): Pokemon {
  return {
    id: p.id,
    name: p.name,
    displayName: displayName(p.name),
    searchName: normalize(p.name),
    types: p.types.flatMap((t) => known(POKEMON_TYPES, t) ?? []),
    stats: { ...p.stats },
    heightM: p.height_decimetres / 10,
    weightKg: p.weight_hectograms / 10,
    baseExperience: p.base_experience,
    abilities: [...p.abilities],
    moves: [...p.moves],
    genus: p.species.genus,
    description: cleanDescription(p.species.description),
    color: known(COLORS, p.species.color),
    shape: known(SHAPES, p.species.shape),
    habitat: known(HABITATS, p.species.habitat),
    isLegendary: p.species.is_legendary,
    isMythical: p.species.is_mythical,
    evolution: evolutions.get(p.species.evolution_chain_id),
    sprite: p.images.sprite,
    artwork: p.images.official_artwork,
  }
}

function toMove(m: RawMove, learnedBy: string[]): Move {
  return {
    name: m.name,
    displayName: displayName(m.name),
    searchName: normalize(m.name),
    type: known(POKEMON_TYPES, m.type),
    power: m.power,
    pp: m.pp,
    accuracy: m.accuracy,
    priority: m.priority,
    damageClass: known(DAMAGE_CLASSES, m.damage_class),
    effectChance: m.effect_chance,
    effect: m.effect,
    shortEffect: m.short_effect,
    learnedBy,
  }
}

function toAbility(a: RawAbility, pokemon: string[]): Ability {
  return {
    name: a.name,
    displayName: displayName(a.name),
    searchName: normalize(a.name),
    effect: a.effect,
    shortEffect: a.short_effect,
    isMainSeries: a.is_main_series,
    pokemon,
  }
}

function groupPokemonBy<K>(
  pokemon: RawPokemon[],
  keysOf: (p: RawPokemon) => K[],
): Map<K, string[]> {
  const groups = new Map<K, string[]>()
  for (const p of pokemon) {
    for (const key of keysOf(p)) {
      const names = groups.get(key) ?? []
      names.push(p.name)
      groups.set(key, names)
    }
  }
  return groups
}

function groupEvolutions(pokemon: RawPokemon[]): Map<number, Evolution> {
  const byId = [...pokemon].sort((a, b) => a.id - b.id)
  const membersByChain = groupPokemonBy(byId, (p) => [
    p.species.evolution_chain_id,
  ])
  return new Map(
    [...membersByChain].map(([chainId, members]) => [
      chainId,
      { chainId, members, stages: evolutionStages(members) },
    ]),
  )
}

// The dataset has no "evolves from": its families are ordered by Pokédex number, and
// Eevee is the only one in the 151 that branches (data discovery, section 2).
const BRANCHING_FAMILIES = new Set(['eevee'])

function evolutionStages(members: string[]): string[][] {
  const [first, ...rest] = members
  if (BRANCHING_FAMILIES.has(first) && rest.length) {
    return [[first], rest]
  }
  return members.map((member) => [member])
}

// The dataset's flavour text keeps print hyphenation: "scav\u00ad enges".
function cleanDescription(description: string): string {
  return description
    .replace(/\u00ad\s*/g, '')
    .replaceAll('POK\u00e9MON', 'Pok\u00e9mon')
}

function known<T extends string>(
  values: readonly T[],
  value: string,
): T | undefined {
  return values.find((v) => v === value)
}
