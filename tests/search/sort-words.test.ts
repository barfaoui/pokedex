import { describe, expect, it } from 'vitest'
import { index } from '@/data/dataset'
import type { Pokemon } from '@/data/types/model'
import { parseQuery } from '@/search/parse'
import { search, semanticQueryOf } from '@/search/search'
import { statValue } from '@/search/stat-value'
import type { SortAttribute } from '@/search/types/query'

function valueOf(pokemon: Pokemon, attribute: SortAttribute): number {
  switch (attribute) {
    case 'weight':
      return pokemon.weightKg
    case 'height':
      return pokemon.heightM
    case 'hpAndDefense':
      return pokemon.stats.hp + pokemon.stats.defense
    default:
      return statValue(pokemon, attribute)
  }
}

/** The values of the listed Pokémon, in the order search returns them. */
function sortedValues(query: string, attribute: SortAttribute): number[] {
  return search(query).flatMap((r) =>
    r.kind === 'pokemon' ? [valueOf(r.item, attribute)] : [],
  )
}

function extreme(attribute: SortAttribute, direction: 'asc' | 'desc') {
  const values = [...index.pokemon.values()].map((p) => valueOf(p, attribute))
  return direction === 'desc' ? Math.max(...values) : Math.min(...values)
}

describe('superlatives and "high / low / most / least + stat"', () => {
  it.each([
    ['fastest', 'speed', 'desc'],
    ['slowest', 'speed', 'asc'],
    ['strongest', 'total', 'desc'],
    ['weakest', 'total', 'asc'],
    ['heaviest', 'weight', 'desc'],
    ['lightest', 'weight', 'asc'],
    ['tallest', 'height', 'desc'],
    ['shortest', 'height', 'asc'],
    ['high hp', 'hp', 'desc'],
    ['low speed', 'speed', 'asc'],
    ['most attack', 'attack', 'desc'],
    ['least defense', 'defense', 'asc'],
    ['high special attack', 'special-attack', 'desc'],
  ] as const)('"%s" sorts by %s, %s', (query, attribute, direction) => {
    expect(parseQuery(query).sort).toEqual({
      word: query,
      attribute,
      direction,
    })
    const values = sortedValues(query, attribute)
    expect(values).toHaveLength(index.pokemon.size)
    expect(values[0]).toBe(extreme(attribute, direction))
    expect(values).toEqual(
      [...values].sort((a, b) => (direction === 'desc' ? b - a : a - b)),
    )
  })

  it('"the fastest pokemon" → Pokémon by speed, Electrode first', () => {
    const results = search('the fastest pokemon')
    expect(results[0].item.name).toBe('electrode')
    expect(results.every((r) => r.kind === 'pokemon')).toBe(true)
  })

  it.each(['the fastest pokemon', 'fast', 'high hp'])(
    '"%s" never calls semantic search: a lone sort word has nothing to search by meaning',
    (query) => {
      expect(semanticQueryOf(query)).toBe('')
    },
  )

  it('"high" alone is not a sort word', () => {
    expect(parseQuery('high').sort).toBeUndefined()
  })
})
