import { describe, expect, it } from 'vitest'
import { matchType } from '@/search/match/type'
import { search } from '@/search/search'

describe('matchType', () => {
  it('scores the full type name 1', () => {
    expect(matchType('electric')).toEqual({ value: 'electric', score: 1 })
  })

  it.each([
    ['fight', 'fighting'],
    ['elec', 'electric'],
    ['psych', 'psychic'],
    ['grou', 'ground'],
  ])('"%s" starts a type name → %s, just under a full match', (word, type) => {
    const match = matchType(word)
    expect(match?.value).toBe(type)
    expect(match?.score).toBeLessThan(1)
    expect(match?.score).toBeGreaterThan(matchType('electrik')!.score)
  })

  it('needs 4 letters to match the start of a type: "ele" matches nothing', () => {
    expect(matchType('ele')).toBeUndefined()
  })

  it('still accepts a typo: "electrik"', () => {
    expect(matchType('electrik')).toEqual({
      value: 'electric',
      score: 1 - 1 / 8,
    })
  })
})

describe('a type by prefix in search', () => {
  it('"fight" → the Fighting Pokémon, not shown as exact matches', () => {
    const fighting = search('fight').filter(
      (r) => r.kind === 'pokemon' && r.item.types.includes('fighting'),
    )
    expect(fighting.map((r) => r.item.name)).toEqual(
      expect.arrayContaining(['machop', 'hitmonlee', 'poliwrath']),
    )
    expect(fighting.every((r) => r.score < 1)).toBe(true)
  })

  it('"elec" → the Electric Pokémon', () => {
    const names = search('elec').map((r) => r.item.name)
    expect(names).toEqual(expect.arrayContaining(['pikachu', 'jolteon']))
  })
})
