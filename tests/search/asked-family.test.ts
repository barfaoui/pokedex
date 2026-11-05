import { describe, expect, it } from 'vitest'
import { search } from '@/search/search'

describe('filler words', () => {
  it('"i want to find pikachu" → Pikachu as an exact match: the filler words don\'t lower its score', () => {
    expect(search('i want to find pikachu')[0]).toMatchObject({
      item: { name: 'pikachu' },
      score: 1,
    })
  })
})

describe('"evolution of X"', () => {
  it('"evolution of charmander" → the whole family first, at Charmander\'s score', () => {
    const top = search('evolution of charmander').slice(0, 3)
    expect(top.map((r) => r.item.name).sort()).toEqual([
      'charizard',
      'charmander',
      'charmeleon',
    ])
    expect(top.every((r) => r.score === 1)).toBe(true)
  })
})
