import { describe, expect, test } from 'vitest'
import { index } from '@/data/dataset'
import { STAT_SCALE, statScale } from '@/features/results/stat-scale'

describe('stat scale', () => {
  test('each stat is scaled to its highest value among the 151', () => {
    expect(STAT_SCALE).toEqual({
      hp: 250,
      attack: 134,
      defense: 180,
      'special-attack': 154,
      'special-defense': 125,
      speed: 150,
      total: 680,
    })
  })

  test('the strongest Pokémon fills its bar', () => {
    const electrode = index.pokemon.get('electrode')
    expect(electrode?.stats.speed).toBe(STAT_SCALE.speed)
  })

  test('is worked out from the Pokémon it is given', () => {
    const pikachu = index.pokemon.get('pikachu')
    const raichu = index.pokemon.get('raichu')
    if (!pikachu || !raichu) {
      throw new Error('missing Pokémon')
    }
    expect(statScale([pikachu, raichu]).speed).toBe(110)
  })
})
