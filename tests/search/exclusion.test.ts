import { describe, expect, it } from 'vitest'
import { dataset } from '@/data/dataset'
import { queryExclusions, search, semanticQueryOf } from '@/search/search'
import type { SearchResult } from '@/search/types/result'

function names(results: SearchResult[]): string[] {
  return results.map((r) => r.item.name)
}

function pokemonWithout(type: string): string[] {
  return dataset.pokemon
    .filter((p) => !p.types.includes(type))
    .map((p) => p.name)
}

describe('excluding with "not" / "no"', () => {
  it('"electric not flying" → no Zapdos, and Pikachu keeps its score of 1: removed, not scored down', () => {
    const results = search('electric not flying')
    expect(names(results)).not.toContain('zapdos')
    expect(results.find((r) => r.item.name === 'pikachu')?.score).toBe(1)
  })

  it('"not electric" → every Pokémon but the Electric types, in Pokédex order', () => {
    const results = search('not electric')
    expect(results.every((r) => r.kind === 'pokemon')).toBe(true)
    expect(names(results)).toEqual(pokemonWithout('electric'))
  })

  it.each(['pokemon not electric', 'not electric pokemon'])(
    '"%s" → the same as "not electric": a kind word names the kind, it is never excluded',
    (query) => {
      expect(names(search(query))).toEqual(pokemonWithout('electric'))
      expect(queryExclusions(query).unknown).toEqual([])
    },
  )

  it('"moves not fire" → every move but the Fire ones', () => {
    const results = search('moves not fire')
    expect(results.length).toBeGreaterThan(0)
    expect(
      results.every((r) => r.kind === 'move' && r.item.type !== 'fire'),
    ).toBe(true)
  })

  it('names containing "no" still work: "snorlax", "onix"', () => {
    expect(search('snorlax')[0].item.name).toBe('snorlax')
    expect(search('onix')[0].item.name).toBe('onix')
  })

  it('"not banana" removes nothing and says it couldn\'t exclude it', () => {
    expect(names(search('not banana'))).toEqual(
      dataset.pokemon.map((p) => p.name),
    )
    expect(queryExclusions('not banana')).toEqual({
      rules: [],
      unknown: ['banana'],
    })
  })

  it('"sleep not sing" → an exact name: Sing removed, Hypnosis kept', () => {
    const found = names(search('sleep not sing'))
    expect(found).not.toContain('sing')
    expect(found).toContain('hypnosis')
  })

  it('"fire moves not burn" → a concept removes the moves that burn, not the Pokémon', () => {
    const results = search('fire moves not burn')
    expect(names(results)).not.toContain('ember')
    expect(names(results)).toContain('charmander')
  })

  it('semantic search never sees the excluded words, and a lone negation never reaches it', () => {
    expect(semanticQueryOf('electric not flying')).toBe('electric')
    expect(semanticQueryOf('not electric')).toBe('')
    expect(semanticQueryOf('no')).toBe('')
    expect(semanticQueryOf('make it fall asleep')).toBe('make it fall asleep')
  })
})
