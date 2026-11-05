import { describe, expect, it } from 'vitest'
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
    ['weakest', 'total', 'asc', 'caterpie'], // tied with Weedle at 195
    ['high hp', 'hp', 'desc', 'chansey'],
    ['high special attack', 'special-attack', 'desc', 'mewtwo'],
    // A phrase is never matched as a name: it was read as a typo of Horn Attack.
    ['most attack', 'attack', 'desc', 'dragonite'],
  ] as const)(
    '"%s" sorts by %s, %s: %s first',
    (query, field, direction, first) => {
      expect(search(query)[0].item.name).toBe(first)
      const values = shownValues(query, field)
      expect(values).toEqual(
        [...values].sort((a, b) => (direction === 'desc' ? b - a : a - b)),
      )
    },
  )

  it('"the fastest pokemon" → Pokémon only, by speed, without calling semantic search', () => {
    const results = search('the fastest pokemon')
    expect(results[0].item.name).toBe('electrode')
    expect(results.every((r) => r.kind === 'pokemon')).toBe(true)
    expect(semanticQueryOf('the fastest pokemon')).toBe('')
  })
})
