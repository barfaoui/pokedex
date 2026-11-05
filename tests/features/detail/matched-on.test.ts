import { describe, expect, test } from 'vitest'
import { matchedOn } from '@/features/detail/matched-on'

describe('matchedOn', () => {
  test('a name match quotes what the user typed, and says when it was a close match', () => {
    expect(
      matchedOn([{ field: 'name', value: 'pikachu' }], 'pikachu', 1),
    ).toEqual(['name “pikachu”'])
    expect(
      matchedOn([{ field: 'name', value: 'pikachu' }], ' Pikachoo ', 0.71),
    ).toEqual(['name “Pikachoo” (close match)'])
  })

  test('a type match names the type', () => {
    expect(
      matchedOn([{ field: 'type', value: 'electric' }], 'electric', 1),
    ).toEqual(['type Electric'])
  })

  test('other matches read like on the card, detail included', () => {
    expect(
      matchedOn(
        [
          { field: 'speed', value: 150 },
          {
            field: 'move',
            value: 'sleep-powder',
            detail: 'Puts the target to sleep.',
          },
        ],
        'fast sleep',
        1,
      ),
    ).toEqual(['speed 150', 'Sleep Powder · Puts the target to sleep.'])
  })
})
