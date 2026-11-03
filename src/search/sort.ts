import type { Pokemon } from '../data/types/model'
import { statValue } from './stat-value'
import type { Sort } from './types/query'
import type { Match, SearchResult } from './types/result'

/** The attribute a sort word sorts by, as shown on a Pokémon result (hp and defense for "tanky"). */
export function sortMatches(sort: Sort, pokemon: Pokemon): Match[] {
  switch (sort.attribute) {
    case 'speed':
    case 'attack':
    case 'total':
      return [
        { field: sort.attribute, value: statValue(pokemon, sort.attribute) },
      ]
    case 'weight':
      return [{ field: 'weight', value: pokemon.weightKg }]
    case 'height':
      return [{ field: 'height', value: pokemon.heightM }]
    case 'hpAndDefense':
      return [
        { field: 'hp', value: pokemon.stats.hp },
        { field: 'defense', value: pokemon.stats.defense },
      ]
  }
}

/** Best score first; equal scores follow the sort word, and items without the attribute come last. */
export function compareResults(sort?: Sort) {
  return (a: SearchResult, b: SearchResult): number =>
    b.score - a.score || (sort ? compareBySort(sort, a, b) : 0)
}

function compareBySort(sort: Sort, a: SearchResult, b: SearchResult): number {
  const valueA = sortValue(sort, a)
  const valueB = sortValue(sort, b)
  if (valueA === undefined || valueB === undefined) {
    return (valueA === undefined ? 1 : 0) - (valueB === undefined ? 1 : 0)
  }
  return sort.direction === 'desc' ? valueB - valueA : valueA - valueB
}

/** The number to sort on (summed for "tanky"); moves and abilities have none. */
function sortValue(sort: Sort, result: SearchResult): number | undefined {
  if (result.kind !== 'pokemon') {
    return undefined
  }
  return sortMatches(sort, result.item).reduce(
    (sum, match) => sum + Number(match.value),
    0,
  )
}
