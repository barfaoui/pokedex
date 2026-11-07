import type { PokedexIndex, Pokemon } from '../data/types/model'
import { ASKED_FAMILY_WEIGHT, FAMILY_WEIGHT } from './scores'
import type { FamilyDirection } from './types/query'
import type { Match, SearchResult } from './types/result'

type PokemonResult = Extract<SearchResult, { kind: 'pokemon' }>

// Members of the same stage aren't related: "vaporeon" brings Eevee, not Jolteon.
export function withEvolutionFamilies(
  results: SearchResult[],
  pokedex: PokedexIndex,
  asked?: FamilyDirection,
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
      asked ?? 'later',
    )) {
      const name = relative.item.name
      const current = family.get(name)
      if (!found.has(name) && (!current || relative.score > current.score)) {
        family.set(name, relative)
      }
    }
  }

  // The final sort is stable: on equal scores, this order stands.
  return asked
    ? [...family.values(), ...results]
    : [...results, ...family.values()]
}

function isNameMatch(result: SearchResult): boolean {
  return result.matched.some((match) => match.field === 'name')
}

function relativesOf(
  pokemon: Pokemon,
  score: number,
  pokedex: PokedexIndex,
  direction: FamilyDirection,
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
  const earlier = stages
    .slice(0, stage)
    .reverse()
    .flat()
    .flatMap((name) => relative(name, 'evolvesInto'))
  const later = stages
    .slice(stage + 1)
    .flat()
    .flatMap((name) => relative(name, 'evolutionOf'))
  switch (direction) {
    case 'earlier':
      return [...earlier, ...later]
    case 'later':
      return [...later, ...earlier]
    case 'last':
      return [...later.reverse(), ...earlier]
  }
}
