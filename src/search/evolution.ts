import type { PokedexIndex, Pokemon } from '../data/types/model'
import type { Match, SearchResult } from './types/result'

// A family member is related to what was asked, not what was asked: well below the Pokémon itself.
// Unless the family is what was asked ("evolution of charmander"): then it ranks with it.
const FAMILY_WEIGHT = 0.6
const ASKED_FAMILY_WEIGHT = 1

type PokemonResult = Extract<SearchResult, { kind: 'pokemon' }>

/**
 * Adds the evolution family of every Pokémon found by its name, in both directions: "pikachu"
 * also brings Raichu, "charizard" Charmander and Charmeleon. A member that matches the query
 * itself keeps its own result. Members of the same stage aren't related: "vaporeon" brings Eevee,
 * not Jolteon.
 */
export function withEvolutionFamilies(
  results: SearchResult[],
  pokedex: PokedexIndex,
  asked = false,
): SearchResult[] {
  const weight = asked ? ASKED_FAMILY_WEIGHT : FAMILY_WEIGHT
  const found = new Set(
    results.filter((r) => r.kind === 'pokemon').map((r) => r.item.name),
  )
  const family = new Map<string, PokemonResult>()

  for (const result of results) {
    if (result.kind !== 'pokemon' || !isNameMatch(result)) {
      continue
    }
    for (const relative of relativesOf(
      result.item,
      result.score * weight,
      pokedex,
    )) {
      const name = relative.item.name
      const current = family.get(name)
      if (!found.has(name) && (!current || relative.score > current.score)) {
        family.set(name, relative)
      }
    }
  }

  return [...results, ...family.values()]
}

function isNameMatch(result: SearchResult): boolean {
  return result.matched.some((match) => match.field === 'name')
}

function relativesOf(
  pokemon: Pokemon,
  score: number,
  pokedex: PokedexIndex,
): PokemonResult[] {
  const stages = pokemon.evolution?.stages ?? []
  const stage = stages.findIndex((members) => members.includes(pokemon.name))
  if (stage < 0) {
    return []
  }
  const relative = (name: string, field: Match['field']): PokemonResult[] => {
    const item = pokedex.pokemon.get(name)
    return item
      ? [
          {
            kind: 'pokemon',
            item,
            score,
            matched: [{ field, value: pokemon.name }],
          },
        ]
      : []
  }
  return [
    ...stages
      .slice(0, stage)
      .flat()
      .flatMap((name) => relative(name, 'evolvesInto')),
    ...stages
      .slice(stage + 1)
      .flat()
      .flatMap((name) => relative(name, 'evolutionOf')),
  ]
}
