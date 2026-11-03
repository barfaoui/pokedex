import { describe, expect, it } from 'vitest'
import { nameScore } from '../../src/search/match-name'

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

  it('keeps partial and typo scores between 0 and 1', () => {
    for (const [part, name] of [
      ['b', 'bulbasaur'],
      ['saur', 'bulbasaur'],
      ['pikachoo', 'pikachu'],
    ]) {
      const score = nameScore(part, name)
      expect(score, part).toBeGreaterThan(0)
      expect(score, part).toBeLessThan(1)
    }
  })

  it('needs 3+ letters to match anywhere in a name', () => {
    expect(nameScore('sa', 'bulbasaur')).toBe(0)
    expect(nameScore('aur', 'bulbasaur')).toBeGreaterThan(0)
  })

  it('scores a typo 1 − changes ÷ length', () => {
    expect(nameScore('pikachoo', 'pikachu')).toBeCloseTo(1 - 2 / 7)
  })

  it('checks typos against the whole name, not each word', () => {
    expect(nameScore('drain', 'rain dish')).toBe(0)
  })

  it('scores 0 when nothing matches', () => {
    expect(nameScore('spaghetti', 'pikachu')).toBe(0)
  })
})
