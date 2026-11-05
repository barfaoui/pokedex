import { describe, expect, it } from 'vitest'
import { search } from '../../src/search/search'
import { editDistance } from '../../src/search/typo'

describe('editDistance', () => {
  it.each([
    ['pikachu', 'pikachy', 1],
    ['pikachu', 'pikachuu', 1],
    ['pikachu', 'pikchu', 1],
    ['pikachu', 'pikahcu', 1],
    ['pikachu', 'pikcahuoo', 3],
  ])('%s → %s: %i change(s)', (a, b, expected) => {
    expect(editDistance(a, b)).toBe(expected)
  })
})

describe('typos in search', () => {
  function pokemonNames(query: string): string[] {
    return search(query)
      .filter((r) => r.kind === 'pokemon')
      .map((r) => r.item.name)
  }

  it('"pikachooo" (3 changes on 7 letters) is past 40%: no Pikachu', () => {
    expect(pokemonNames('pikachooo')).not.toContain('pikachu')
  })
})
