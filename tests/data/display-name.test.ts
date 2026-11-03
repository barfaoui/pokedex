import { describe, expect, it } from 'vitest'
import { dataset } from '../../src/data/dataset'
import { displayName } from '../../src/data/display-name'

describe('displayName', () => {
  it.each([
    ['bulbasaur', 'Bulbasaur'],
    ['sleep-powder', 'Sleep Powder'],
    ['solar-beam', 'Solar Beam'],
    ['high-jump-kick', 'High Jump Kick'],
    ['lightning-rod', 'Lightning Rod'],
  ])('title-cases each word: %s → %s', (name, expected) => {
    expect(displayName(name)).toBe(expected)
  })

  it.each([
    ['nidoran-f', 'Nidoran♀'],
    ['nidoran-m', 'Nidoran♂'],
    ['mr-mime', 'Mr. Mime'],
    ['farfetchd', "Farfetch'd"],
    ['double-edge', 'Double-Edge'],
    ['self-destruct', 'Self-Destruct'],
    ['soft-boiled', 'Soft-Boiled'],
  ])('uses the official name: %s → %s', (name, expected) => {
    expect(displayName(name)).toBe(expected)
  })

  it('gives every name in the dataset a readable display name', () => {
    const officialHyphens = new Set([
      'Double-Edge',
      'Self-Destruct',
      'Soft-Boiled',
    ])
    const names = [
      ...dataset.pokemon.map((p) => p.name),
      ...dataset.moves.map((m) => m.name),
      ...dataset.abilities.map((a) => a.name),
    ]
    for (const name of names) {
      const shown = displayName(name)
      expect(shown, name).toMatch(/^[A-Z]/)
      if (!officialHyphens.has(shown)) expect(shown, name).not.toContain('-')
    }
  })
})
