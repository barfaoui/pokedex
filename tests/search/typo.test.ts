import { describe, expect, it } from 'vitest'
import { search } from '../../src/search/search'
import { editDistance, typoLimit } from '../../src/search/typo'

describe('editDistance', () => {
  it.each([
    ['pikachu', 'pikachu', 0],
    ['pikachu', 'pikachy', 1],
    ['pikachu', 'pikachuu', 1],
    ['pikachu', 'pikchu', 1],
    ['pikachu', 'pikahcu', 1],
    ['pikachu', 'pikachoo', 2],
    ['pikachu', 'pikcahuoo', 3],
  ])('%s → %s: %i change(s)', (a, b, expected) => {
    expect(editDistance(a, b)).toBe(expected)
  })
})

describe('typoLimit: at most 30% of the letters', () => {
  it.each([
    [3, 0],
    [4, 1],
    [6, 1],
    [10, 3],
  ])('%i letters → %i change(s)', (length, expected) => {
    expect(typoLimit(length)).toBe(expected)
  })
})

describe('typos in search', () => {
  function pokemonNames(query: string): string[] {
    return search(query)
      .filter((r) => r.kind === 'pokemon')
      .map((r) => r.item.name)
  }

  it('"pikachoo" (2 changes on 7 letters) finds Pikachu', () => {
    expect(pokemonNames('pikachoo')).toContain('pikachu')
  })

  it('"pikachooo" (3 changes on 7 letters) does not', () => {
    expect(pokemonNames('pikachooo')).not.toContain('pikachu')
  })

  it('"pikahcu" finds Pikachu: a swap counts as one change', () => {
    expect(pokemonNames('pikahcu')).toContain('pikachu')
  })
})
