import { describe, expect, test } from 'vitest'
import { index } from '@/data/dataset'
import { evolutionAround } from '@/features/detail/evolution'

function around(name: string) {
  const evolution = index.pokemon.get(name)?.evolution
  if (!evolution) {
    throw new Error(name)
  }
  return evolutionAround(evolution, name)
}

describe('evolutionAround', () => {
  test('a middle form has one form before and one after', () => {
    expect(around('ivysaur')).toEqual({
      previous: ['bulbasaur'],
      next: ['venusaur'],
    })
  })

  test('a first form has nothing before, a last form nothing after', () => {
    expect(around('bulbasaur')).toEqual({ previous: [], next: ['ivysaur'] })
    expect(around('venusaur')).toEqual({ previous: ['ivysaur'], next: [] })
  })

  test('Eevee evolves into each of its three forms', () => {
    expect(around('eevee')).toEqual({
      previous: [],
      next: ['vaporeon', 'jolteon', 'flareon'],
    })
  })

  test('one branch of Eevee does not list the other branches', () => {
    expect(around('jolteon')).toEqual({ previous: ['eevee'], next: [] })
  })

  test('a Pokémon that does not evolve has nothing around it', () => {
    expect(around('tauros')).toEqual({ previous: [], next: [] })
  })
})
