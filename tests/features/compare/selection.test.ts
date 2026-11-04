import { describe, expect, test } from 'vitest'
import { toggleSelection } from '@/features/compare/selection'

describe('toggleSelection', () => {
  test('ticks a Pokémon that is not selected', () => {
    expect(toggleSelection([], 'pikachu')).toEqual(['pikachu'])
    expect(toggleSelection(['pikachu'], 'raichu')).toEqual([
      'pikachu',
      'raichu',
    ])
  })

  test('unticks a Pokémon that is selected', () => {
    expect(toggleSelection(['pikachu', 'raichu'], 'pikachu')).toEqual([
      'raichu',
    ])
  })

  test('a third tick replaces the oldest', () => {
    expect(toggleSelection(['pikachu', 'raichu'], 'jolteon')).toEqual([
      'raichu',
      'jolteon',
    ])
  })
})
