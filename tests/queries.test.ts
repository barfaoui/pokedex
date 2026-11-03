import { describe, expect, it } from 'vitest'
import { dataset } from '../src/data/dataset'
import { search } from '../src/search/search'
import type { ResultKind, SearchResult } from '../src/search/types/result'

function namesOf(results: SearchResult[], kind: ResultKind): string[] {
  return results.filter((r) => r.kind === kind).map((r) => r.item.name)
}

const SLEEP_MOVES = ['sing', 'sleep-powder', 'hypnosis', 'lovely-kiss', 'spore']
const SLEEP_OPPOSITES = ['insomnia', 'vital-spirit', 'rest']
const RAIN_ABILITIES = ['swift-swim', 'rain-dish', 'hydration', 'dry-skin']
const RAIN_MOVES = ['thunder', 'solar-beam']

describe('PRD test queries', () => {
  it('"bulba" → Bulbasaur first', () => {
    expect(search('bulba')[0]).toMatchObject({
      kind: 'pokemon',
      item: { name: 'bulbasaur' },
    })
  })

  it('"pikachoo" → Pikachu first', () => {
    expect(search('pikachoo')[0]).toMatchObject({
      kind: 'pokemon',
      item: { name: 'pikachu' },
    })
  })

  it('"saur" → Bulbasaur, Ivysaur, Venusaur', () => {
    const results = search('saur')
    expect(results.every((r) => r.kind === 'pokemon')).toBe(true)
    expect(new Set(results.map((r) => r.item.name))).toEqual(
      new Set(['bulbasaur', 'ivysaur', 'venusaur']),
    )
    expect(results).toHaveLength(3)
  })

  it('"fast electric" → Electrode (150), Jolteon (130), Raichu (110), in that order', () => {
    expect(namesOf(search('fast electric'), 'pokemon').slice(0, 3)).toEqual([
      'electrode',
      'jolteon',
      'raichu',
    ])
  })

  it('"green" → the 9 green Pokémon', () => {
    const results = search('green')
    expect(namesOf(results, 'pokemon')).toHaveLength(9)
    expect(new Set(namesOf(results, 'pokemon'))).toEqual(
      new Set([
        'bulbasaur',
        'ivysaur',
        'venusaur',
        'caterpie',
        'metapod',
        'bellsprout',
        'weepinbell',
        'victreebel',
        'scyther',
      ]),
    )
  })

  describe('"put my opponent to sleep"', () => {
    const results = search('put my opponent to sleep')

    it('returns Sing, Sleep Powder, Hypnosis, Lovely Kiss, Spore and the ability Effect Spore', () => {
      for (const move of SLEEP_MOVES) {
        expect(namesOf(results, 'move'), move).toContain(move)
      }
      expect(namesOf(results, 'ability')).toContain('effect-spore')
    })

    it('returns their Pokémon with what matched, e.g. Jigglypuff · Sing', () => {
      const jigglypuff = results.find(
        (r) => r.kind === 'pokemon' && r.item.name === 'jigglypuff',
      )
      expect(jigglypuff?.matched).toContainEqual({
        field: 'move',
        value: 'sing',
        detail: 'Puts the target to sleep.',
      })
    })

    it('never returns Insomnia, Vital Spirit or Rest, nor shows them as what matched', () => {
      for (const result of results) {
        expect(SLEEP_OPPOSITES, result.item.name).not.toContain(
          result.item.name,
        )
        for (const match of result.matched) {
          expect(
            SLEEP_OPPOSITES,
            `${result.item.name} · ${match.value}`,
          ).not.toContain(match.value)
        }
      }
    })

    it('returns Drowzee for Hypnosis, even though it has Insomnia', () => {
      const drowzee = results.find(
        (r) => r.kind === 'pokemon' && r.item.name === 'drowzee',
      )
      expect(drowzee?.matched).toContainEqual({
        field: 'move',
        value: 'hypnosis',
        detail: 'Puts the target to sleep.',
      })
    })
  })

  describe('"rain team"', () => {
    const results = search('rain team')

    it('returns Swift Swim, Rain Dish, Hydration, Dry Skin, Thunder and Solar Beam', () => {
      for (const ability of RAIN_ABILITIES) {
        expect(namesOf(results, 'ability'), ability).toContain(ability)
      }
      for (const move of RAIN_MOVES) {
        expect(namesOf(results, 'move'), move).toContain(move)
      }
    })

    it('returns every Pokémon with a rain ability', () => {
      const rainPokemon = dataset.pokemon
        .filter((p) => p.abilities.some((a) => RAIN_ABILITIES.includes(a)))
        .map((p) => p.name)
      expect(rainPokemon).toHaveLength(25)
      for (const name of rainPokemon) {
        expect(namesOf(results, 'pokemon'), name).toContain(name)
      }
    })
  })

  describe('"sun team"', () => {
    const results = search('sun team')
    const names = results.map((r) => r.item.name)

    it('returns Drought, Chlorophyll, Solar Power, Growth, Solar Beam and Thunder', () => {
      for (const name of [
        'drought',
        'chlorophyll',
        'solar-power',
        'growth',
        'solar-beam',
        'thunder',
      ]) {
        expect(names, name).toContain(name)
      }
    })

    it('shows Thunder as affected by sun', () => {
      const thunder = results.find((r) => r.item.name === 'thunder')
      expect(thunder?.matched).toContainEqual(
        expect.objectContaining({ direction: 'affected' }),
      )
    })

    it('does not return Mirror Move', () => {
      expect(names).not.toContain('mirror-move')
    })
  })

  it.each(['drain', 'trainer'])('"%s" → no rain results', (query) => {
    const names = search(query).map((r) => r.item.name)
    for (const rain of [...RAIN_ABILITIES, ...RAIN_MOVES]) {
      expect(names, rain).not.toContain(rain)
    }
  })

  it('"spaghetti" → no results', () => {
    expect(search('spaghetti')).toEqual([])
  })
})

describe('M6 · match score on the PRD queries', () => {
  const QUERIES = [
    'bulba',
    'pikachoo',
    'fast electric',
    'green',
    'put my opponent to sleep',
    'rain team',
  ]

  it.each(QUERIES)('"%s" → scores between 0 and 1', (query) => {
    const results = search(query)
    expect(results.length).toBeGreaterThan(0)
    for (const { item, score } of results) {
      expect(score, item.name).toBeGreaterThanOrEqual(0)
      expect(score, item.name).toBeLessThanOrEqual(1)
    }
  })

  it.each(QUERIES)('"%s" → sorted by score, best first', (query) => {
    const scores = search(query).map((r) => r.score)
    expect(scores.length).toBeGreaterThan(0)
    expect(scores).toEqual([...scores].sort((a, b) => b - a))
  })

  it('"bulbasaur" → exact match, scored 1', () => {
    expect(search('bulbasaur')[0]).toMatchObject({
      item: { name: 'bulbasaur' },
      score: 1,
    })
  })

  it.each(['bulba', 'pikachoo'])(
    '"%s" → best match scored below 1',
    (query) => {
      const [best] = search(query)
      expect(best, query).toBeDefined()
      expect(best.score, query).toBeGreaterThan(0)
      expect(best.score, query).toBeLessThan(1)
    },
  )
})
