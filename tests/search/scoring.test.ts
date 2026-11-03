// PRD M6: every result has a 0–1 match score, results are sorted by it, exact matches score 1.
import { describe, expect, it } from 'vitest'
import { search } from '../../src/search/search'

const QUERIES = [
  'bulba',
  'pikachoo',
  'fast electric',
  'green',
  'put my opponent to sleep',
  'rain team',
]

describe('match score', () => {
  it.each(QUERIES)('"%s" → scores between 0 and 1', (query) => {
    const results = search(query)
    expect(results.length).toBeGreaterThan(0)
    for (const { name, score } of results) {
      expect(score, name).toBeGreaterThanOrEqual(0)
      expect(score, name).toBeLessThanOrEqual(1)
    }
  })

  it.each(QUERIES)('"%s" → sorted by score, best first', (query) => {
    const scores = search(query).map((r) => r.score)
    expect(scores.length).toBeGreaterThan(0)
    expect(scores).toEqual([...scores].sort((a, b) => b - a))
  })

  it('scores an exact match 1', () => {
    expect(search('bulbasaur')[0]).toMatchObject({
      name: 'bulbasaur',
      score: 1,
    })
  })

  it('scores a partial or misspelled name below 1', () => {
    for (const query of ['bulba', 'pikachoo']) {
      const [best] = search(query)
      expect(best?.score, query).toBeGreaterThan(0)
      expect(best?.score, query).toBeLessThan(1)
    }
  })
})
