import { describe, expect, it } from 'vitest'
import { parseQuery } from '@/search/parse'
import { search } from '@/search/search'

describe('kind words', () => {
  it('a named kind wins over the "can" hint: "pokemon that can paralyze" asks for Pokémon', () => {
    expect(parseQuery('pokemon that can paralyze').kinds).toEqual(['pokemon'])
  })

  it("are not searched as words, so they don't drag the score down", () => {
    const parts = parseQuery('pokemon that paralyzes the enemy').parts
    expect(parts).toEqual([
      { kind: 'word', text: 'paralyzes', concept: 'paralysis' },
    ])
  })

  it('a lone kind word is still searched as a word, with nothing to rank', () => {
    const parsed = parseQuery('pokemon')
    expect(parsed.kinds).toBeUndefined()
    expect(parsed.parts).toHaveLength(1)
  })

  it('"pokemon that paralyzes the enemy" → the Pokémon first, then the moves and abilities that do it, kept below', () => {
    const results = search('pokemon that paralyzes the enemy')
    expect(results[0].kind).toBe('pokemon')
    const lastPokemon = results.findLastIndex((r) => r.kind === 'pokemon')
    const thunderWave = results.findIndex((r) => r.item.name === 'thunder-wave')
    expect(thunderWave).toBeGreaterThan(lastPokemon)
    // Ranked, not filtered: the abilities stay too.
    expect(results.map((r) => r.item.name)).toContain('static')
  })

  it('"paralysis moves" → the moves first', () => {
    expect(search('paralysis moves')[0].kind).toBe('move')
  })

  it('"that can paralyze" → the abilities first', () => {
    expect(search('that can paralyze')[0].kind).toBe('ability')
  })

  it('still matches a name that contains a kind word: "mirror move"', () => {
    expect(search('mirror move')[0]).toMatchObject({
      kind: 'move',
      item: { name: 'mirror-move' },
      score: 1,
    })
  })
})
