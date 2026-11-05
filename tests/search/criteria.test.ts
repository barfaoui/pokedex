import { describe, expect, it } from 'vitest'
import { search } from '../../src/search/search'

describe('criteria search', () => {
  it('"electric" returns electric moves as well as Pokémon', () => {
    const moves = search('electric')
      .filter((r) => r.kind === 'move')
      .map((r) => r.item.name)
    expect(moves).toContain('thunderbolt')
  })

  it('"fast electric" returns only Pokémon, since moves have no speed', () => {
    const results = search('fast electric')
    expect(results.length).toBeGreaterThan(0)
    expect(results.every((r) => r.kind === 'pokemon')).toBe(true)
  })

  it('"fast electric" shows the type and the speed it was sorted by', () => {
    const jolteon = search('fast electric').find(
      (r) => r.item.name === 'jolteon',
    )
    expect(jolteon?.matched).toEqual([
      { field: 'type', value: 'electric' },
      { field: 'speed', value: 130 },
    ])
  })

  it('a lone sort word: "slow" → its name matches first, then every other Pokémon once, slowest first, none as an exact match', () => {
    const results = search('slow')
    const names = results.map((r) => r.item.name)
    expect(new Set(names.slice(0, 2))).toEqual(new Set(['slowpoke', 'slowbro']))
    const listed = results.slice(2)
    expect(listed.every((r) => r.kind === 'pokemon')).toBe(true)
    expect(listed).toHaveLength(149)
    const speeds = listed.map((r) =>
      r.kind === 'pokemon' ? r.item.stats.speed : 0,
    )
    expect(speeds).toEqual([...speeds].sort((a, b) => a - b))
    expect(results.every((r) => r.score < 1)).toBe(true)
    expect(new Set(names).size).toBe(names.length)
  })
})
