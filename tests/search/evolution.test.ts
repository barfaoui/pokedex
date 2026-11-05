import { describe, expect, it } from 'vitest'
import { search } from '@/search/search'
import type { SearchResult } from '@/search/types/result'

function pokemon(results: SearchResult[], name: string) {
  return results.find((r) => r.kind === 'pokemon' && r.item.name === name)
}

function names(results: SearchResult[]): string[] {
  return results.filter((r) => r.kind === 'pokemon').map((r) => r.item.name)
}

describe('evolution family of a Pokémon found by name', () => {
  it('"pikachu" → Raichu, "Evolution of Pikachu", at Pikachu\'s score × 0.6', () => {
    const results = search('pikachu')
    expect(pokemon(results, 'raichu')).toMatchObject({
      score: pokemon(results, 'pikachu')!.score * 0.6,
      matched: [{ field: 'evolutionOf', value: 'pikachu' }],
    })
  })

  it('"charizard" → Charmander and Charmeleon, "Evolves into Charizard"', () => {
    const results = search('charizard')
    for (const name of ['charmander', 'charmeleon']) {
      expect(pokemon(results, name)?.matched, name).toEqual([
        { field: 'evolvesInto', value: 'charizard' },
      ])
    }
  })

  it('"charmeleon" → Charmander before it, Charizard after it', () => {
    const results = search('charmeleon')
    expect(pokemon(results, 'charmander')?.matched).toEqual([
      { field: 'evolvesInto', value: 'charmeleon' },
    ])
    expect(pokemon(results, 'charizard')?.matched).toEqual([
      { field: 'evolutionOf', value: 'charmeleon' },
    ])
  })

  it('"vaporeon" → Eevee only, not its siblings', () => {
    const found = names(search('vaporeon'))
    expect(found).toContain('eevee')
    expect(found).not.toContain('jolteon')
    expect(found).not.toContain('flareon')
  })

  it('"eevee" → its three evolutions', () => {
    const results = search('eevee')
    for (const name of ['vaporeon', 'jolteon', 'flareon']) {
      expect(pokemon(results, name)?.matched, name).toEqual([
        { field: 'evolutionOf', value: 'eevee' },
      ])
    }
  })

  it('a member that matches the query itself keeps its own score and match: "pikachu electric" → Raichu by its type', () => {
    const raichu = pokemon(search('pikachu electric'), 'raichu')
    expect(raichu?.matched).toEqual([{ field: 'type', value: 'electric' }])
    expect(raichu?.score).toBe(0.5)
  })

  it('no family for a type query: "electric"', () => {
    for (const result of search('electric')) {
      for (const match of result.matched) {
        expect(['evolutionOf', 'evolvesInto'], result.item.name).not.toContain(
          match.field,
        )
      }
    }
  })
})
