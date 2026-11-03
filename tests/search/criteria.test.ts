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

  it('"speed over 150" → Electrode first as a near miss, slow Pokémon hidden', () => {
    const results = search('speed over 150')
    expect(results[0]).toMatchObject({ item: { name: 'electrode' } })
    expect(results[0].score).toBeCloseTo(0.95)
    expect(results.map((r) => r.item.name)).not.toContain('slowpoke')
  })

  describe('a lone sort word', () => {
    const results = search('slow')
    const names = results.map((r) => r.item.name)

    it('lists its name matches first', () => {
      expect(new Set(names.slice(0, 2))).toEqual(
        new Set(['slowpoke', 'slowbro']),
      )
    })

    it('then lists every other Pokémon, slowest first', () => {
      const listed = results.slice(2)
      expect(listed.every((r) => r.kind === 'pokemon')).toBe(true)
      expect(listed).toHaveLength(149)
      const speeds = listed.map((r) =>
        r.kind === 'pokemon' ? r.item.stats.speed : 0,
      )
      expect(speeds).toEqual([...speeds].sort((a, b) => a - b))
    })

    it('never shows a listed Pokémon as an exact match', () => {
      expect(results.every((r) => r.score < 1)).toBe(true)
    })

    it('lists each Pokémon once', () => {
      expect(new Set(names).size).toBe(names.length)
    })
  })

  it('"spaghetti" → no results', () => {
    expect(search('spaghetti')).toEqual([])
  })
})
