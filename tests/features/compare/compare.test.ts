import { describe, expect, test } from 'vitest'
import { index } from '@/data/dataset'
import type { Pokemon } from '@/data/types/model'
import { compareStats, sharedTraits } from '@/features/compare/compare'

function pokemon(name: string): Pokemon {
  const found = index.pokemon.get(name)
  if (!found) {
    throw new Error(name)
  }
  return found
}

describe('compareStats', () => {
  const rows = compareStats(pokemon('electrode'), pokemon('jolteon'))

  test('has one row per stat, then the total', () => {
    expect(rows.map((row) => row.stat)).toEqual([
      'hp',
      'attack',
      'defense',
      'special-attack',
      'special-defense',
      'speed',
      'total',
    ])
  })

  test('says which of the two is higher', () => {
    expect(rows.find((row) => row.stat === 'speed')).toEqual({
      stat: 'speed',
      left: 150,
      right: 130,
      higher: 'left',
    })
    expect(rows.find((row) => row.stat === 'hp')?.higher).toBe('right')
  })

  test('sums the stats into the total', () => {
    expect(rows.at(-1)).toEqual({
      stat: 'total',
      left: 490,
      right: 525,
      higher: 'right',
    })
  })

  test('equal values are a tie', () => {
    const special = compareStats(pokemon('raichu'), pokemon('electrode')).find(
      (row) => row.stat === 'special-defense',
    )
    expect(special?.higher).toBe('tie')
  })
})

describe('sharedTraits', () => {
  test('lists the types and abilities both have', () => {
    expect(sharedTraits(pokemon('electrode'), pokemon('voltorb'))).toEqual({
      types: ['electric'],
      abilities: ['aftermath', 'soundproof', 'static'],
    })
  })

  test('nothing in common gives empty lists', () => {
    expect(sharedTraits(pokemon('electrode'), pokemon('jolteon'))).toEqual({
      types: ['electric'],
      abilities: [],
    })
    expect(sharedTraits(pokemon('pikachu'), pokemon('bulbasaur'))).toEqual({
      types: [],
      abilities: [],
    })
  })
})
