import { describe, expect, it } from 'vitest'
import { index } from '@/data/dataset'
import { search } from '@/search/search'

describe('legendary and mythical', () => {
  it('"legendaries" → every Pokémon the data flags as legendary, as exact matches', () => {
    const legendary = [...index.pokemon.values()]
      .filter((p) => p.isLegendary)
      .map((p) => p.name)
      .sort()
    const exact = search('legendaries').filter(
      (r) => r.score === 1 && r.matched.some((m) => m.field === 'legendary'),
    )
    expect(exact.map((r) => r.item.name).sort()).toEqual(legendary)
  })

  it('"mythic psychic" → the mythical Psychic Pokémon first', () => {
    const first = search('mythic psychic')[0]
    expect(first?.kind === 'pokemon' && first.item.isMythical).toBe(true)
  })
})
