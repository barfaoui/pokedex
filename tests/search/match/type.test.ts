import { describe, expect, it } from 'vitest'
import { matchType } from '@/search/match/type'
import { search } from '@/search/search'

describe('a type by the start of its name', () => {
  it('"elec" → Electric, scored under a full match but above a typo', () => {
    const match = matchType('elec')
    expect(match?.value).toBe('electric')
    expect(match?.score).toBeLessThan(1)
    expect(match?.score).toBeGreaterThan(matchType('electrik')!.score)
  })

  it('needs 4 letters: "ele" matches no type', () => {
    expect(matchType('ele')).toBeUndefined()
  })

  it('"fight" → the Fighting Pokémon, none shown as an exact match', () => {
    const fighting = search('fight').filter(
      (r) => r.kind === 'pokemon' && r.item.types.includes('fighting'),
    )
    expect(fighting.map((r) => r.item.name)).toEqual(
      expect.arrayContaining(['machop', 'hitmonlee', 'poliwrath']),
    )
    expect(fighting.every((r) => r.score < 1)).toBe(true)
  })
})

describe('a colour, shape or habitat matched loosely, like a type', () => {
  it('"purpel" → the purple Pokémon, none shown as an exact match', () => {
    const purple = search('purpel').filter(
      (r) => r.kind === 'pokemon' && r.item.color === 'purple',
    )
    expect(purple.length).toBeGreaterThan(0)
    expect(purple.every((r) => r.score < 1)).toBe(true)
  })
})
