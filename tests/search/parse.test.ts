import { describe, expect, it } from 'vitest'
import { parseQuery } from '../../src/search/parse'

describe('parseQuery', () => {
  describe('stat conditions', () => {
    it.each([
      ['speed over 150', 'speed', 'over', 150],
      ['attack > 100', 'attack', 'over', 100],
      ['special attack >= 90', 'special-attack', 'atLeast', 90],
      ['hp below 50', 'hp', 'under', 50],
      ['defense at most 40', 'defense', 'atMost', 40],
      ['total more than 500', 'total', 'over', 500],
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

  describe('sort words', () => {
    it.each([
      ['fast', 'speed', 'desc'],
      ['slow', 'speed', 'asc'],
      ['strong', 'attack', 'desc'],
      ['strongest', 'total', 'desc'],
      ['best', 'total', 'desc'],
      ['heavy', 'weight', 'desc'],
      ['tall', 'height', 'desc'],
      ['tanky', 'hpAndDefense', 'desc'],
    ])('%s → %s, %s', (word, attribute, direction) => {
      const parsed = parseQuery(word)
      expect(parsed.sort).toEqual({ word, attribute, direction })
      expect(parsed.parts).toEqual([])
    })

    it('keeps only the first sort word as the sort', () => {
      const parsed = parseQuery('fast heavy')
      expect(parsed.sort?.word).toBe('fast')
      expect(parsed.parts).toEqual([{ kind: 'word', text: 'heavy' }])
    })
  })

  describe('descriptors', () => {
    it.each([
      ['green', { field: 'color', value: 'green' }],
      ['cave', { field: 'habitat', value: 'cave' }],
      ['fish', { field: 'shape', value: 'fish' }],
      ['waters edge', { field: 'habitat', value: 'waters-edge' }],
      ['bug wings', { field: 'shape', value: 'bug-wings' }],
    ])('%s', (query, descriptor) => {
      expect(parseQuery(query).parts).toEqual([
        { kind: 'word', text: query, descriptor },
      ])
    })
  })

  describe('types', () => {
    it('recognises a type', () => {
      expect(parseQuery('electric').parts).toEqual([
        {
          kind: 'word',
          text: 'electric',
          type: { value: 'electric', score: 1 },
        },
      ])
    })

    it('recognises a type with a typo, scored below 1', () => {
      const [part] = parseQuery('electrik').parts
      expect(part).toMatchObject({
        kind: 'word',
        type: { value: 'electric' },
      })
      expect(part.kind === 'word' && part.type?.score).toBeCloseTo(1 - 1 / 8)
    })

    it('needs an exact match for 3-letter types', () => {
      expect(parseQuery('icy').parts).toEqual([{ kind: 'word', text: 'icy' }])
    })
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
    })
  })

  describe('concepts', () => {
    it.each([
      ['sleep', 'sleep'],
      ['doze', 'sleep'],
      ['paralyze', 'paralysis'],
      ['flinch', 'flinch'],
    ] as const)('"%s" → %s', (word, concept) => {
      expect(parseQuery(word).parts).toEqual([
        { kind: 'word', text: word, concept },
      ])
    })

    it('does not recognise weather words yet (M4)', () => {
      expect(parseQuery('rain').parts).toEqual([{ kind: 'word', text: 'rain' }])
    })
  })

  describe('filler words', () => {
    it('drops them around the words that matter', () => {
      expect(parseQuery('put my opponent to sleep').parts).toEqual([
        { kind: 'word', text: 'sleep', concept: 'sleep' },
      ])
    })

    it('keeps them when the query is only filler', () => {
      expect(parseQuery('to').parts).toEqual([{ kind: 'word', text: 'to' }])
    })
  })

  it('keeps unknown words as plain words', () => {
    expect(parseQuery('spaghetti').parts).toEqual([
      { kind: 'word', text: 'spaghetti' },
    ])
  })

  it('returns no parts for an empty query', () => {
    expect(parseQuery('  ')).toEqual({ parts: [] })
  })
})
