import { describe, expect, it } from 'vitest'
import { index } from '@/data/dataset'
import { search } from '@/search/search'

const pokemonOf = (query: string) =>
  search(query).flatMap((r) =>
    r.kind === 'pokemon' ? [{ item: r.item, score: r.score }] : [],
  )

describe('weights and heights with units', () => {
  it('"lighter than 1 kg" → exact matches all weigh under 1 kg', () => {
    const exact = pokemonOf('lighter than 1 kg').filter((r) => r.score === 1)
    expect(exact.length).toBeGreaterThan(0)
    expect(exact.every((r) => r.item.weightKg < 1)).toBe(true)
  })

  it('"shorter than 50 cm" converts the unit: exact matches are all under 0.5 m', () => {
    const exact = pokemonOf('shorter than 50 cm').filter((r) => r.score === 1)
    expect(exact.length).toBeGreaterThan(0)
    expect(exact.every((r) => r.item.heightM < 0.5)).toBe(true)
  })

  it('a bare measure, "6.5kg", ranks the Pokémon closest to it first', () => {
    const distance = (kg: number) => Math.abs(kg - 6.5)
    const closest = Math.min(
      ...[...index.pokemon.values()].map((p) => distance(p.weightKg)),
    )
    expect(distance(pokemonOf('6.5kg')[0].item.weightKg)).toBe(closest)
  })
})
