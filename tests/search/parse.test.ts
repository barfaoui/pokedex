import { describe, expect, it } from 'vitest'
import { parseQuery } from '../../src/search/parse'

describe('parseQuery', () => {
  describe('"not" / "no" segments', () => {
    it('searches what comes before, excludes what follows up to "and"', () => {
      const parsed = parseQuery('fire but not flying and fast')
      expect(parsed.excluded).toEqual([['flying']])
      expect(parsed.normalizedQuery).toBe('fire but fast')
    })

    it('starts a new segment at each negation', () => {
      expect(parseQuery('water not ice no blue').excluded).toEqual([
        ['ice'],
        ['blue'],
      ])
    })
  })

  describe('stat conditions', () => {
    // One per way of writing it: plain, operator, two-word stat, two-word comparison, decimal.
    it.each([
      ['speed over 150', 'speed', 'over', 150],
      ['attack > 100', 'attack', 'over', 100],
      ['special attack >= 90', 'special-attack', 'atLeast', 90],
      ['defense at most 40', 'defense', 'atMost', 40],
      ['speed over 99.5', 'speed', 'over', 99.5],
    ])('%s', (query, stat, comparison, value) => {
      expect(parseQuery(query).parts).toEqual([
        { kind: 'stat', stat, comparison, value },
      ])
    })

    it('keeps an incomplete condition as words', () => {
      expect(parseQuery('speed over').parts.map((p) => p.kind)).toEqual([
        'word',
        'word',
      ])
    })
  })

  it('keeps only the first sort word as the sort', () => {
    const parsed = parseQuery('fast heavy')
    expect(parsed.sort?.word).toBe('fast')
    expect(parsed.parts).toMatchObject([{ kind: 'word', text: 'heavy' }])
  })

  it('reads a two-word descriptor as one word: "waters edge"', () => {
    expect(parseQuery('waters edge').parts).toEqual([
      {
        kind: 'word',
        text: 'waters edge',
        descriptor: {
          value: { field: 'habitat', value: 'waters-edge' },
          score: 1,
        },
      },
    ])
  })

  // A descriptor typo ("purpel") is tested through search, in match/type.test.ts.
  it('reads the start of a descriptor as a close one, scored below 1: "mount"', () => {
    const [part] = parseQuery('mount').parts
    expect(part).toMatchObject({
      descriptor: { value: { field: 'habitat', value: 'mountain' } },
    })
    expect(part.kind === 'word' && part.descriptor?.score).toBeLessThan(1)
  })

  it('parses "fast electric" into a speed sort and a typed word', () => {
    expect(parseQuery('fast electric')).toEqual({
      sort: { word: 'fast', attribute: 'speed', direction: 'desc' },
      parts: [
        {
          kind: 'word',
          text: 'electric',
          type: { value: 'electric', score: 1 },
        },
      ],
      normalizedQuery: 'fast electric',
    })
  })

  it('reads "doze" as the concept sleep', () => {
    expect(parseQuery('doze').parts).toMatchObject([
      { kind: 'word', text: 'doze', concept: 'sleep' },
    ])
  })

  describe('filler words', () => {
    it('drops them around the words that matter', () => {
      // A word can also read as a low-score type typo ("sleep" → steel): only the concept matters here.
      expect(parseQuery('put my opponent to sleep').parts).toMatchObject([
        { kind: 'word', text: 'sleep', concept: 'sleep' },
      ])
    })

    it('keeps them when the query is only filler', () => {
      expect(parseQuery('to').parts).toEqual([{ kind: 'word', text: 'to' }])
    })
  })

  it('returns no parts for an empty query', () => {
    expect(parseQuery('  ')).toEqual({ parts: [], normalizedQuery: '' })
  })

  it('keeps the whole normalised query, filler words included', () => {
    expect(parseQuery('Double Team').normalizedQuery).toBe('double team')
    expect(parseQuery('speed > 100').normalizedQuery).toBe('speed over 100')
  })
})
