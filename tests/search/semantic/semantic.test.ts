import { describe, expect, test } from 'vitest'
import { needsSemantic, search } from '@/search/search'
import { SEMANTIC_THRESHOLD } from '@/search/scores'
import {
  rescale,
  semanticResults,
  withQueryDirection,
  withSemanticResults,
} from '@/search/semantic/semantic'
import type { EmbeddedText } from '@/search/semantic/model'
import { index } from '@/data/dataset'
import type { SearchResult } from '@/search/types/result'

// A stand-in model: 3-number "embeddings" written by hand, so the ranking rules can be tested
// without loading the real one. Each text points mostly along one axis.
const TEXTS: EmbeddedText[] = [
  { kind: 'move', name: 'sing', source: 'short' },
  { kind: 'move', name: 'sing', source: 'full' },
  { kind: 'move', name: 'growl', source: 'short' },
  { kind: 'ability', name: 'insomnia', source: 'short' },
  { kind: 'pokemon', name: 'drowzee', source: 'description' },
  { kind: 'move', name: 'not-in-the-dataset', source: 'short' },
]

function unit(...values: number[]): number[] {
  const length = Math.hypot(...values)
  return values.map((value) => value / length)
}

const VECTORS = new Float32Array([
  ...unit(1, 0.2, 0), // sing, short
  ...unit(1, 0.05, 0), // sing, full: closer to "sleep"
  ...unit(0, 1, 0), // growl
  ...unit(0.1, 0, 1), // insomnia
  ...unit(1, 0.05, 0), // drowzee: as close as Sing's full effect
  ...unit(1, 0, 0), // an item the dataset doesn't have
])

const SLEEPY_QUERY = new Float32Array(unit(1, 0, 0))

describe('rescale', () => {
  test('maps similarity to 0–1, clamped, never quite an exact match', () => {
    expect(rescale(-0.2)).toBe(0)
    expect(rescale(0)).toBe(0)
    expect(rescale(1)).toBeLessThan(1)
    expect(rescale(0.6)).toBeGreaterThan(rescale(0.5))
  })
})

describe('semanticResults', () => {
  const results = semanticResults(SLEEPY_QUERY, TEXTS, VECTORS)

  test('keeps the better of the short and the full effect, one result per item', () => {
    const sing = results.filter((result) => result.item.name === 'sing')
    expect(sing).toHaveLength(1)
    expect(sing[0].score).toBeCloseTo(rescale(unit(1, 0.05, 0)[0]))
  })

  test('a description ranks below a move that is just as close', () => {
    const names = results.map((result) => result.item.name)
    expect(names.indexOf('sing')).toBeLessThan(names.indexOf('drowzee'))
  })

  test('shows the short effect or the description as what matched', () => {
    const sing = results.find((result) => result.item.name === 'sing')
    expect(sing?.matched).toEqual([
      { field: 'effect', value: 'Puts the target to sleep.' },
    ])
    const drowzee = results.find((result) => result.item.name === 'drowzee')
    expect(drowzee?.matched[0].field).toBe('description')
  })

  test('below the threshold is nothing', () => {
    const names = results.map((result) => result.item.name)
    expect(names).not.toContain('growl')
    expect(names).not.toContain('insomnia')
    for (const { score } of results) {
      expect(score).toBeGreaterThanOrEqual(SEMANTIC_THRESHOLD)
    }
  })

  test('only items from the dataset', () => {
    expect(results.map((result) => result.item.name)).not.toContain(
      'not-in-the-dataset',
    )
  })
})

describe('withSemanticResults', () => {
  test('adds the semantic results, each item once with its better score', () => {
    const manual = search('sing')
    const semantic = semanticResults(SLEEPY_QUERY, TEXTS, VECTORS)
    const merged = withSemanticResults(manual, semantic)
    const sing = merged.filter(
      (result) => result.kind === 'move' && result.item.name === 'sing',
    )
    expect(sing).toHaveLength(1)
    expect(sing[0].score).toBe(1)
    expect(merged.map((result) => result.item.name)).toContain('drowzee')
    const scores = merged.map((result) => result.score)
    expect(scores).toEqual([...scores].sort((a, b) => b - a))
  })

  test('with nothing from meaning, the manual results stay as they are', () => {
    const manual = search('sun team')
    expect(withSemanticResults(manual, [])).toBe(manual)
  })
})

describe('needsSemantic', () => {
  // "pikachoo" (0.71) is the weakest answer that must count as confident.
  test('"pikachoo": manual search is confident', () => {
    expect(needsSemantic(search('pikachoo'))).toBe(false)
  })

  test('"make the enemy doze off": manual search is not confident', () => {
    expect(needsSemantic(search('make the enemy doze off'))).toBe(true)
  })
})

describe('withQueryDirection', () => {
  // What the model returns for a sleepy query: the right moves, but also what puts itself to
  // sleep (Rest) or prevents it (Insomnia, Vital Spirit).
  const SLEEPY_RESULTS: SearchResult[] = [
    ...['sleep-powder', 'hypnosis', 'rest'].map((name) => ({
      kind: 'move' as const,
      item: index.moves.get(name)!,
      score: 0.6,
      matched: [],
    })),
    ...['insomnia', 'vital-spirit'].map((name) => ({
      kind: 'ability' as const,
      item: index.abilities.get(name)!,
      score: 0.5,
      matched: [],
    })),
    {
      kind: 'pokemon',
      item: index.pokemon.get('drowzee')!,
      score: 0.4,
      matched: [],
    },
  ]

  function names(results: SearchResult[]) {
    return results.map((result) => result.item.name)
  }

  test('"make it fall asleep" keeps Sleep Powder and Hypnosis, drops Rest, Insomnia and Vital Spirit', () => {
    expect(
      names(withQueryDirection(SLEEPY_RESULTS, 'make it fall asleep')),
    ).toEqual(['sleep-powder', 'hypnosis', 'drowzee'])
  })

  test('a query with no direction keeps every result', () => {
    expect(withQueryDirection(SLEEPY_RESULTS, 'heal the user')).toEqual(
      SLEEPY_RESULTS,
    )
  })

  test('a negation leaves the direction unclear: "prevent sleep" keeps Insomnia', () => {
    expect(withQueryDirection(SLEEPY_RESULTS, 'prevent sleep')).toEqual(
      SLEEPY_RESULTS,
    )
  })
})
