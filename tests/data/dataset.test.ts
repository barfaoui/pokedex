import { describe, expect, it } from 'vitest'
import { dataset } from '../../src/data/dataset'

const { pokemon, moves, abilities } = dataset

describe('dataset', () => {
  it('has the expected counts', () => {
    expect(pokemon).toHaveLength(151)
    expect(moves).toHaveLength(164)
    expect(abilities).toHaveLength(114)
  })

  it('has unique names', () => {
    for (const list of [pokemon, moves, abilities]) {
      const names = list.map((item) => item.name)
      expect(new Set(names).size).toBe(names.length)
    }
  })

  it('has an effect text for every move and ability', () => {
    for (const item of [...moves, ...abilities]) {
      expect(item.effect.trim(), item.name).not.toBe('')
      expect(item.short_effect.trim(), item.name).not.toBe('')
    }
  })

  it('only references moves and abilities that exist', () => {
    const moveNames = new Set(moves.map((m) => m.name))
    const abilityNames = new Set(abilities.map((a) => a.name))
    for (const p of pokemon) {
      for (const m of p.moves)
        expect(moveNames.has(m), `${p.name} → ${m}`).toBe(true)
      for (const a of p.abilities)
        expect(abilityNames.has(a), `${p.name} → ${a}`).toBe(true)
    }
  })
})
