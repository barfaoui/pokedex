import { describe, expect, it } from 'vitest'
import { dataset } from '../../src/data/dataset'
import { displayName } from '../../src/data/display-name'

describe('displayName', () => {
  it('title-cases each word', () => {
    expect(displayName('high-jump-kick')).toBe('High Jump Kick')
  })

  it('uses the official name where title case would be wrong', () => {
    expect(displayName('nidoran-f')).toBe('Nidoran♀')
    expect(displayName('double-edge')).toBe('Double-Edge')
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
      if (!officialHyphens.has(shown)) {
        expect(shown, name).not.toContain('-')
      }
    }
  })
})
