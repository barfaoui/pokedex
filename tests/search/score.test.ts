import { describe, expect, it } from 'vitest'
import { index } from '../../src/data/dataset'
import { parseQuery } from '../../src/search/parse'
import { scoreItem } from '../../src/search/score'
import type { SearchableItem } from '../../src/search/types/result'

function pokemon(name: string): SearchableItem {
  const item = index.pokemon.get(name)
  expect(item, name).toBeDefined()
  return { kind: 'pokemon', item: item as NonNullable<typeof item> }
}

function score(query: string, searchable: SearchableItem) {
  return scoreItem(parseQuery(query), searchable, index)
}

describe('scoreItem', () => {
  it('averages the score over the parts of the query, showing only the parts that matched', () => {
    // Pikachu: electric (1) but not green (0)
    const pikachu = score('electric green', pokemon('pikachu'))
    expect(pikachu.score).toBe(0.5)
    expect(pikachu.matched).toEqual([{ field: 'type', value: 'electric' }])
  })

  it('scores a type 1, and a type typo below 1', () => {
    expect(score('electric', pokemon('pikachu')).score).toBe(1)
    expect(score('electrik', pokemon('pikachu')).score).toBeCloseTo(1 - 1 / 8)
  })

  it('scores a descriptor 1, and shows it', () => {
    expect(score('green', pokemon('bulbasaur')).score).toBe(1)
    expect(score('green', pokemon('charmander')).score).toBe(0)
    expect(score('green', pokemon('bulbasaur')).matched).toEqual([
      { field: 'color', value: 'green' },
    ])
  })

  describe('stat conditions', () => {
    it("scores a met condition 1, and shows the stat's actual value", () => {
      expect(score('speed over 100', pokemon('electrode')).score).toBe(1)
      expect(score('speed over 100', pokemon('jolteon')).matched).toEqual([
        { field: 'speed', value: 130 },
      ])
    })

    it('scores a near miss on how close it is', () => {
      // Electrode's speed is exactly 150, so "over 150" is just missed
      expect(score('speed over 150', pokemon('electrode')).score).toBeCloseTo(
        0.95,
      )
    })

    it('scores a far miss 0', () => {
      // Pikachu's speed is 90: less than half of 200
      expect(score('speed over 200', pokemon('pikachu')).score).toBe(0)
    })

    it('scores "under" conditions the same way', () => {
      expect(score('speed under 50', pokemon('slowpoke')).score).toBe(1)
      expect(score('speed under 50', pokemon('pikachu')).score).toBeCloseTo(
        (0.95 * 50) / 90,
      )
    })
  })
})
