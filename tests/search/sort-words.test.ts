import { describe, expect, it } from 'vitest'
import { index } from '@/data/dataset'
import { search, semanticQueryOf } from '@/search/search'
import type { MatchField } from '@/search/types/result'

function shownValues(query: string, field: MatchField): number[] {
  return search(query).flatMap((r) => {
    const match = r.matched.find((m) => m.field === field)
    return match ? [Number(match.value)] : []
  })
}

describe('superlatives and "high / low / most / least + stat"', () => {
  // First Pokémon looked up in the dataset; on a tie, Pokédex order decides.
  it.each([
    ['weakest', 'total', 'asc', 'caterpie'], // tied with Weedle at 195
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

describe('superlatives sort by the stat they name', () => {
  const pokemon = [...index.pokemon.values()]
  const top = (query: string) => {
    const first = search(query)[0]
    return first?.kind === 'pokemon' ? first.item : undefined
  }

  it('"highest speed" → the fastest Pokémon first', () => {
    const fastest = Math.max(...pokemon.map((p) => p.stats.speed))
    expect(top('highest speed')?.stats.speed).toBe(fastest)
  })

  it('"lowest hp" → the Pokémon with the least HP first', () => {
    const lowest = Math.min(...pokemon.map((p) => p.stats.hp))
    expect(top('lowest hp')?.stats.hp).toBe(lowest)
  })

  it('"tankiest" sorts like "tanky": HP plus defense', () => {
    const tankiest = Math.max(
      ...pokemon.map((p) => p.stats.hp + p.stats.defense),
    )
    const first = top('tankiest')
    expect(first && first.stats.hp + first.stats.defense).toBe(tankiest)
  })
})
