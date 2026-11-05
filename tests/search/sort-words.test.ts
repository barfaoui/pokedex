import { describe, expect, it } from 'vitest'
import { index } from '@/data/dataset'
import { parseQuery } from '@/search/parse'
import { search, semanticQueryOf } from '@/search/search'
import type { MatchField } from '@/search/types/result'

/** The sorted value search itself shows on each Pokémon, in the order it returns them. */
function shownValues(query: string, field: MatchField): number[] {
  return search(query).flatMap((r) => {
    const match = r.matched.find((m) => m.field === field)
    return match ? [Number(match.value)] : []
  })
}

describe('superlatives and "high / low / most / least + stat"', () => {
  // First Pokémon looked up in the dataset; on a tie, Pokédex order decides.
  it.each([
    ['fastest', 'speed', 'desc', 'electrode'],
    ['slowest', 'speed', 'asc', 'slowpoke'],
    ['strongest', 'total', 'desc', 'mewtwo'],
    ['weakest', 'total', 'asc', 'caterpie'], // tied with Weedle at 195
    ['heaviest', 'weight', 'desc', 'snorlax'],
    ['lightest', 'weight', 'asc', 'gastly'], // tied with Haunter at 0.1 kg
    ['tallest', 'height', 'desc', 'onix'],
    ['shortest', 'height', 'asc', 'diglett'],
    ['high hp', 'hp', 'desc', 'chansey'],
    ['low speed', 'speed', 'asc', 'slowpoke'],
    ['most attack', 'attack', 'desc', 'dragonite'],
    ['least defense', 'defense', 'asc', 'chansey'],
    ['high special attack', 'special-attack', 'desc', 'mewtwo'],
  ] as const)(
    '"%s" sorts by %s, %s: %s first',
    (query, attribute, direction, first) => {
      expect(parseQuery(query).sort).toEqual({
        word: query,
        attribute,
        direction,
      })
      expect(search(query)[0].item.name).toBe(first)

      const values = shownValues(query, attribute)
      expect(values).toHaveLength(index.pokemon.size)
      expect(values).toEqual(
        [...values].sort((a, b) => (direction === 'desc' ? b - a : a - b)),
      )
    },
  )

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
