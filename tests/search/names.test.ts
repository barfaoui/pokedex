import { describe, expect, it } from 'vitest'
import { search } from '../../src/search/search'

describe('multi-word names', () => {
  it('"double team" → Double Team first, as an exact match, though "team" is a filler word', () => {
    expect(search('double team')[0]).toMatchObject({
      item: { name: 'double-team' },
      score: 1,
    })
  })

  it('"mr mime" → Mr. Mime, as an exact match', () => {
    expect(search('mr mime')[0]).toMatchObject({
      item: { name: 'mr-mime' },
      score: 1,
    })
  })
})

describe('short words', () => {
  it('"weather in paris" → "in" alone finds no name starting with it', () => {
    const names = search('weather in paris').map((r) => r.item.name)
    for (const name of [
      'insomnia',
      'intimidate',
      'inner-focus',
      'infiltrator',
    ]) {
      expect(names).not.toContain(name)
    }
  })

  it('"ab" typed alone still finds Abra', () => {
    expect(search('ab').map((r) => r.item.name)).toContain('abra')
  })
})
