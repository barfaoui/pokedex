import { describe, expect, it } from 'vitest'
import { search } from '../../src/search/search'

describe('category (genus) words', () => {
  it('a whole word of a Pokémon’s category finds it: "shellfish" → Blastoise, the Shellfish Pokémon', () => {
    const blastoise = search('shellfish').find(
      (r) => r.item.name === 'blastoise',
    )
    expect(blastoise?.score).toBe(1)
    expect(blastoise?.matched).toEqual([
      { field: 'genus', value: 'Shellfish Pokémon' },
    ])
  })

  it('only a whole word counts: "shell" doesn’t reach Blastoise through its category', () => {
    const blastoise = search('shell').find((r) => r.item.name === 'blastoise')
    expect(blastoise?.matched ?? []).not.toContainEqual(
      expect.objectContaining({ field: 'genus' }),
    )
  })
})
