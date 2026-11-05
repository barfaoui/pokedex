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

describe('which way a family query points', () => {
  const first = (query: string) => search(query)[0]?.item.name

  it('"evolution of X" → its next form first, before X itself', () => {
    expect(first('evolution of squirtle')).toBe('wartortle')
  })

  it('"what evolves into X" → its previous form first', () => {
    expect(first('what evolves into venusaur')).toBe('ivysaur')
  })

  it('"final evolution of X" → the last form first', () => {
    expect(first('final evolution of caterpie')).toBe('butterfree')
  })
})
