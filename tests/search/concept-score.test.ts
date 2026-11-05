import { describe, expect, it } from 'vitest'
import { search } from '@/search/search'
import type { ResultKind, SearchResult } from '@/search/types/result'

// One stated status, one that is only a chance, one weather. Not "poison": it is also a type,
// a literal match that rightly scores 1.
const CONCEPT_QUERIES = ['put my opponent to sleep', 'burn', 'rain team']

function scoreOf(
  results: SearchResult[],
  kind: ResultKind,
  name: string,
): number {
  const result = results.find((r) => r.kind === kind && r.item.name === name)
  expect(result, name).toBeDefined()
  return result!.score
}

describe('concept scores', () => {
  it.each(CONCEPT_QUERIES)(
    '"%s" → no result scores 1: a concept is an interpretation, not an exact match',
    (query) => {
      const exact = search(query).filter((r) => r.score === 1)
      expect(exact.map((r) => r.item.name)).toEqual([])
    },
  )

  it('ranks Sleep Powder above Hypnosis: the typed word "sleep" is in its name', () => {
    const results = search('put my opponent to sleep')
    expect(scoreOf(results, 'move', 'sleep-powder')).toBeGreaterThan(
      scoreOf(results, 'move', 'hypnosis'),
    )
  })

  it('gives no name bonus for a word that was not typed: "asleep" does not lift Sleep Powder', () => {
    const results = search('asleep')
    expect(scoreOf(results, 'move', 'sleep-powder')).toBe(
      scoreOf(results, 'move', 'hypnosis'),
    )
  })

  it('ranks an effect stated outright above one that is only a chance: Hypnosis above Effect Spore', () => {
    const results = search('sleep')
    expect(scoreOf(results, 'move', 'hypnosis')).toBeGreaterThan(
      scoreOf(results, 'ability', 'effect-spore'),
    )
  })

  it('"paralysis" → Synchronize stays listed, below a chance: it only passes on a status it received', () => {
    const results = search('paralysis')
    const synchronize = scoreOf(results, 'ability', 'synchronize')
    expect(synchronize).toBeGreaterThan(0)
    expect(synchronize).toBeLessThan(
      Math.min(
        ...results
          .filter((r) => r.kind === 'move' && r.matched[0]?.field === 'effect')
          .map((r) => r.score),
      ),
    )
  })

  it.each(CONCEPT_QUERIES)(
    '"%s" → every Pokémon scores below its best move or ability, and more of them lift it',
    (query) => {
      const results = search(query)
      const scores = new Map(
        results.map((r) => [`${r.kind}:${r.item.name}`, r.score]),
      )
      const pokemon = results.filter(
        (r) =>
          r.kind === 'pokemon' &&
          r.matched.some((m) => m.field === 'move' || m.field === 'ability'),
      )
      expect(pokemon.length).toBeGreaterThan(0)
      for (const result of pokemon) {
        const related = result.matched
          .filter((m) => m.field === 'move' || m.field === 'ability')
          .map((m) => scores.get(`${m.field}:${m.value}`) ?? 0)
        const best = Math.max(...related)
        expect(result.score, result.item.name).toBeLessThan(best)
        expect(result.score, result.item.name).toBeGreaterThanOrEqual(
          best * 0.9 - 1e-9,
        )
        if (related.length > 1) {
          expect(result.score, result.item.name).toBeGreaterThan(best * 0.9)
        }
      }
    },
  )

  it('keeps the weather order under the concept ceiling: starts, then benefits, then affected', () => {
    const results = search('sun')
    const drought = scoreOf(results, 'ability', 'drought')
    const chlorophyll = scoreOf(results, 'ability', 'chlorophyll')
    const thunder = scoreOf(results, 'move', 'thunder')
    expect(drought).toBeLessThan(1)
    expect(drought).toBeGreaterThan(chlorophyll)
    expect(chlorophyll).toBeGreaterThan(thunder)
  })
})
