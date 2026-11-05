import { describe, expect, test } from 'vitest'
import { exclusionNote } from '@/features/results/exclusion-note'

describe('exclusionNote', () => {
  test('lists several exclusions once each', () => {
    expect(
      exclusionNote({
        rules: [
          { kind: 'type', value: 'psychic' },
          { kind: 'name', searchName: 'psychic', name: 'psychic' },
          {
            kind: 'descriptor',
            descriptor: { field: 'habitat', value: 'waters-edge' },
          },
        ],
        unknown: [],
      }),
    ).toEqual(['Excluding: Psychic, habitat waters edge'])
  })

  test("says what it couldn't exclude", () => {
    expect(exclusionNote({ rules: [], unknown: ['banana'] })).toEqual([
      "Can't exclude “banana”",
    ])
  })

  test('nothing negated, no note', () => {
    expect(exclusionNote({ rules: [], unknown: [] })).toEqual([])
  })
})
