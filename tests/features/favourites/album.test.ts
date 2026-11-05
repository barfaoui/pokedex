import { describe, expect, test } from 'vitest'
import { index } from '@/data/dataset'
import type { Pokemon } from '@/data/types/model'
import { albumStats, pocketCount } from '@/features/favourites/album'

function pokemon(name: string): Pokemon {
  const found = index.pokemon.get(name)
  if (!found) {
    throw new Error(name)
  }
  return found
}

describe('albumStats', () => {
  test("shows the Pokémon's two highest stats, highest first", () => {
    expect(albumStats(pokemon('pikachu'))).toEqual([
      { label: 'Spd', value: 90 },
      { label: 'Atk', value: 55 },
    ])
    expect(albumStats(pokemon('lapras'))).toEqual([
      { label: 'HP', value: 130 },
      { label: 'SpD', value: 95 },
    ])
  })

  test('a tie keeps the usual stat order (HP, Atk, Def, SpA, SpD, Spd)', () => {
    expect(albumStats(pokemon('eevee'))).toEqual([
      { label: 'SpD', value: 65 },
      { label: 'HP', value: 55 },
    ])
  })
})

describe('pocketCount', () => {
  test('fills whole pages of 6 pockets, one page even when empty', () => {
    expect(pocketCount(0)).toBe(6)
    expect(pocketCount(1)).toBe(6)
    expect(pocketCount(6)).toBe(6)
    expect(pocketCount(7)).toBe(12)
    expect(pocketCount(13)).toBe(18)
  })
})
