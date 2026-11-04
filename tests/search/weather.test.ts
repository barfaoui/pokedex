import { describe, expect, it } from 'vitest'
import { search } from '../../src/search/search'

function rankOf(query: string, name: string): number {
  const rank = search(query).findIndex((r) => r.item.name === name)
  expect(rank, name).toBeGreaterThanOrEqual(0)
  return rank
}

describe('weather search', () => {
  it('ranks what starts the weather first: Drought before Chlorophyll', () => {
    expect(rankOf('sun', 'drought')).toBeLessThan(rankOf('sun', 'chlorophyll'))
  })

  it('ranks what benefits before what is only affected: Swift Swim before Solar Beam', () => {
    expect(rankOf('rain', 'swift-swim')).toBeLessThan(
      rankOf('rain', 'solar-beam'),
    )
  })

  it("shows a move's weather sentence and direction, not its short effect", () => {
    const thunder = search('rain').find((r) => r.item.name === 'thunder')
    expect(thunder?.matched).toEqual([
      {
        field: 'effect',
        value: 'During Rain Dance, this move has 100% accuracy.',
        direction: 'benefits',
      },
    ])
  })

  it('shows the ability behind a Pokémon, with its sentence and direction', () => {
    const squirtle = search('rain').find((r) => r.item.name === 'squirtle')
    expect(squirtle?.matched).toContainEqual({
      field: 'ability',
      value: 'rain-dish',
      detail: 'Heals for 1/16 max HP after each turn during rain.',
      direction: 'benefits',
    })
  })

  it('does not return Mega Drain for "rain"', () => {
    expect(search('rain').map((r) => r.item.name)).not.toContain('mega-drain')
  })

  it('still finds names that start with a weather word: "sand" → Sandshrew', () => {
    expect(search('sand').map((r) => r.item.name)).toContain('sandshrew')
  })
})
