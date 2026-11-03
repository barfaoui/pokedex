import { describe, expect, it } from 'vitest'
import { normalize } from '../../src/search/normalize'

describe('normalize', () => {
  it.each([
    ['Pokémon', 'pokemon'],
    ['à', 'a'],
    ['BULBASAUR', 'bulbasaur'],
    ['sleep-powder', 'sleep powder'],
    ['Mr. Mime', 'mr mime'],
    ["Farfetch'd", 'farfetchd'],
    ['Nidoran♀', 'nidoran f'],
    ['Nidoran♂', 'nidoran m'],
    ['  sleep   powder ', 'sleep powder'],
  ])('%s → %s', (text, expected) => {
    expect(normalize(text)).toBe(expected)
  })
})
