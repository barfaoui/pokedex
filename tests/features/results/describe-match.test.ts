import { describe, expect, test } from 'vitest'
import {
  describeMatch,
  describeMatches,
} from '@/features/results/describe-match'
import type { Match } from '@/search/types/result'

describe('describeMatch', () => {
  test('a stat is a bar with its value', () => {
    expect(describeMatch({ field: 'speed', value: 150 })).toEqual({
      kind: 'stat',
      label: 'speed',
      value: 150,
      max: 150,
    })
  })

  test('stats get short readable labels', () => {
    expect(describeMatch({ field: 'hp', value: 250 })).toMatchObject({
      label: 'HP',
    })
    expect(
      describeMatch({ field: 'special-attack', value: 154 }),
    ).toMatchObject({ label: 'sp. attack' })
  })

  test('the total has its own maximum', () => {
    expect(describeMatch({ field: 'total', value: 680 })).toEqual({
      kind: 'stat',
      label: 'total',
      value: 680,
      max: 680,
    })
  })

  test('a move or ability shows its name and what it does', () => {
    expect(
      describeMatch({
        field: 'ability',
        value: 'swift-swim',
        detail: 'Doubles Speed during rain.',
      }),
    ).toEqual({
      kind: 'text',
      label: 'Swift Swim',
      detail: 'Doubles Speed during rain.',
    })
  })

  test("an effect shows the sentence, labelled by how it's related", () => {
    expect(
      describeMatch({
        field: 'effect',
        value: 'Summons strong sunlight.',
        direction: 'starts',
      }),
    ).toEqual({
      kind: 'text',
      label: 'Starts',
      detail: 'Summons strong sunlight.',
    })
    expect(
      describeMatch({ field: 'effect', value: 'Puts the target to sleep.' }),
    ).toEqual({
      kind: 'text',
      label: 'Effect',
      detail: 'Puts the target to sleep.',
    })
  })

  test('colour, habitat and shape read as words', () => {
    expect(describeMatch({ field: 'color', value: 'green' })).toEqual({
      kind: 'text',
      label: 'colour green',
    })
    expect(describeMatch({ field: 'habitat', value: 'waters-edge' })).toEqual({
      kind: 'text',
      label: 'habitat waters edge',
    })
  })

  test('height and weight carry their unit', () => {
    expect(describeMatch({ field: 'height', value: 8.8 })).toEqual({
      kind: 'text',
      label: 'height 8.8 m',
    })
    expect(describeMatch({ field: 'weight', value: 460 })).toEqual({
      kind: 'text',
      label: 'weight 460 kg',
    })
  })

  test('name and type are already on the card, so they add no line', () => {
    expect(describeMatch({ field: 'name', value: 'pikachu' })).toBeUndefined()
    expect(describeMatch({ field: 'type', value: 'electric' })).toBeUndefined()
  })
})

describe('describeMatches', () => {
  const sunMatches: Match[] = [
    { field: 'type', value: 'grass' },
    { field: 'move', value: 'growth', detail: 'Raises stats in sun.' },
    { field: 'move', value: 'solar-beam', detail: 'No charge in sun.' },
    { field: 'ability', value: 'chlorophyll', detail: 'Faster in sun.' },
  ]

  test('keeps the first lines and counts the rest', () => {
    const { lines, moreCount } = describeMatches(sunMatches, 2)
    expect(lines.map((line) => line.label)).toEqual(['Growth', 'Solar Beam'])
    expect(moreCount).toBe(1)
  })

  test('nothing more to show counts 0', () => {
    expect(describeMatches(sunMatches.slice(0, 2), 2).moreCount).toBe(0)
  })
})
