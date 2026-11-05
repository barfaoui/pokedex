import { describe, expect, it } from 'vitest'
import { index } from '@/data/dataset'
import { search } from '@/search/search'

const learnersOf = (name: string) =>
  [...index.pokemon.values()]
    .filter((p) => p.moves.includes(name) || p.abilities.includes(name))
    .map((p) => p.name)
    .sort()

describe('which Pokémon learn a move or have an ability', () => {
  it('"which pokemon learn psywave" → every Pokémon that learns it, before the move itself', () => {
    const results = search('which pokemon learn psywave')
    const learners = learnersOf('psywave')
    const top = results.slice(0, learners.length)
    expect(top.map((r) => r.item.name).sort()).toEqual(learners)
    expect(top[0].matched).toContainEqual({ field: 'move', value: 'psywave' })
  })

  it('"@psywave", the Pokémon GO syntax, asks the same', () => {
    const top = search('@psywave').slice(0, learnersOf('psywave').length)
    expect(top.map((r) => r.item.name).sort()).toEqual(learnersOf('psywave'))
  })

  it('"pokemon with static" → the Pokémon that have the ability first', () => {
    const top = search('pokemon with static').slice(
      0,
      learnersOf('static').length,
    )
    expect(top.map((r) => r.item.name).sort()).toEqual(learnersOf('static'))
  })

  it('without a learn or have word, a move name doesn’t list its learners: "psychic pokemon" stays the Psychic type', () => {
    const results = search('psychic pokemon').filter(
      (r) => r.kind === 'pokemon',
    )
    expect(results.every((r) => r.item.types.includes('psychic'))).toBe(true)
  })
})
