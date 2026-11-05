import { describe, expect, it } from 'vitest'
import { nameScore } from '../../../src/search/match/name'

describe('nameScore', () => {
  it('scores an exact match 1', () => {
    expect(nameScore('bulbasaur', 'bulbasaur')).toBe(1)
    expect(nameScore('mr mime', 'mr mime')).toBe(1)
  })

  it('scores the start of a name above a match anywhere in it', () => {
    expect(nameScore('bulb', 'bulbasaur')).toBeGreaterThan(
      nameScore('saur', 'bulbasaur'),
    )
  })

  it('scores higher when the part covers more of the name', () => {
    expect(nameScore('bulba', 'bulbasaur')).toBeGreaterThan(
      nameScore('bul', 'bulbasaur'),
    )
    expect(nameScore('asaur', 'bulbasaur')).toBeGreaterThan(
      nameScore('saur', 'bulbasaur'),
    )
  })

  it('needs 3+ letters to match anywhere in a name', () => {
    expect(nameScore('sa', 'bulbasaur')).toBe(0)
    expect(nameScore('aur', 'bulbasaur')).toBeGreaterThan(0)
  })

  it('with shortPrefix: false, needs 3+ letters to match the start of a name', () => {
    expect(nameScore('in', 'insomnia', { shortPrefix: false })).toBe(0)
    expect(
      nameScore('ins', 'insomnia', { shortPrefix: false }),
    ).toBeGreaterThan(0)
    expect(nameScore('in', 'insomnia')).toBeGreaterThan(0)
  })

  it('allows typos up to 40% of the name: "blaaastoiise" → Blastoise', () => {
    expect(nameScore('blaaastoiise', 'blastoise')).toBeCloseTo(1 - 3 / 9)
  })

  it('checks typos against the whole name, not each word', () => {
    expect(nameScore('drain', 'rain dish')).toBe(0)
  })
})
