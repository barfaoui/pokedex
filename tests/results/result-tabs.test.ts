import { describe, expect, test } from 'vitest'
import { search } from '../../src/search/search'
import { resultsInTab, tabCounts } from '../../src/results/result-tabs'

describe('result tabs', () => {
  test('All keeps every result in the order search ranked them', () => {
    const results = search('sun team')
    expect(resultsInTab(results, 'all')).toEqual(results)
  })

  test('each kind tab keeps only its kind, in the same order', () => {
    const results = search('sun team')
    const kinds = { pokemon: 'pokemon', abilities: 'ability', moves: 'move' }
    for (const [tab, kind] of Object.entries(kinds)) {
      const inTab = resultsInTab(results, tab as keyof typeof kinds)
      // 'sun team' has every kind, so no tab can pass by being empty
      expect(inTab.length, tab).toBeGreaterThan(0)
      expect(inTab, tab).toEqual(
        results.filter((result) => result.kind === kind),
      )
    }
  })

  test('counts each tab, All being the total', () => {
    const results = search('put my opponent to sleep')
    const counts = tabCounts(results)
    expect(counts.all).toBe(results.length)
    expect(counts.pokemon + counts.abilities + counts.moves).toBe(counts.all)
    expect(counts.moves).toBe(
      results.filter((result) => result.kind === 'move').length,
    )
  })

  test('an empty search counts 0 everywhere', () => {
    expect(tabCounts([])).toEqual({
      all: 0,
      pokemon: 0,
      abilities: 0,
      moves: 0,
    })
  })
})
