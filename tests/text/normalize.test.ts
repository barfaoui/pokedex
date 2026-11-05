import { describe, expect, it } from 'vitest'
import { normalize } from '../../src/text/normalize'

describe('normalize', () => {
  it.each([
    ['Pokémon', 'pokemon'],
    ['sleep-powder', 'sleep powder'],
    ['Mr. Mime', 'mr mime'],
    ["Farfetch'd", 'farfetchd'],
    ['Nidoran♀', 'nidoran f'],
    ['Nidoran♂', 'nidoran m'],
    ['  sleep   powder ', 'sleep powder'],
    ['speed over 99.5', 'speed over 99.5'],
  ])('%s → %s', (text, expected) => {
    expect(normalize(text)).toBe(expected)
  })
})
