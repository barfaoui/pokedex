import { describe, expect, it } from 'vitest'
import { buildIndex } from '../../src/data/build-index'
import { dataset } from '../../src/data/dataset'

const index = buildIndex(dataset)

function get<T>(items: Map<string, T>, name: string): T {
  const item = items.get(name)
  expect(item, name).toBeDefined()
  return item as T
}

describe('buildIndex', () => {
  it('keeps every Pokémon, move and ability', () => {
    expect(index.pokemon.size).toBe(151)
    expect(index.moves.size).toBe(164)
    expect(index.abilities.size).toBe(114)
  })

  it('keys every item by its dataset name, in dataset order', () => {
    expect([...index.pokemon.keys()]).toEqual(
      dataset.pokemon.map((p) => p.name),
    )
    expect([...index.moves.keys()]).toEqual(dataset.moves.map((m) => m.name))
    expect([...index.abilities.keys()]).toEqual(
      dataset.abilities.map((a) => a.name),
    )
  })

  it('converts height to metres and weight to kilograms', () => {
    const bulbasaur = get(index.pokemon, 'bulbasaur')
    expect(bulbasaur.heightM).toBeCloseTo(0.7)
    expect(bulbasaur.weightKg).toBeCloseTo(6.9)

    const pikachu = get(index.pokemon, 'pikachu')
    expect(pikachu.heightM).toBeCloseTo(0.4)
    expect(pikachu.weightKg).toBeCloseTo(6)
  })

  it('keeps types and stats', () => {
    expect(get(index.pokemon, 'electrode').stats.speed).toBe(150)
    expect(get(index.pokemon, 'clefairy').types).toEqual(['fairy'])
    expect(get(index.pokemon, 'bulbasaur').types).toEqual(['grass', 'poison'])
    expect(get(index.pokemon, 'pikachu').stats).toEqual({
      hp: 35,
      attack: 55,
      defense: 40,
      'special-attack': 50,
      'special-defense': 50,
      speed: 90,
    })
  })

  it('normalises names for search', () => {
    expect(get(index.pokemon, 'mr-mime').searchName).toBe('mr mime')
    expect(get(index.pokemon, 'nidoran-f').searchName).toBe('nidoran f')
    expect(get(index.moves, 'sleep-powder').searchName).toBe('sleep powder')
    expect(get(index.abilities, 'rain-dish').searchName).toBe('rain dish')
  })

  it('flattens species fields onto the Pokémon', () => {
    const bulbasaur = get(index.pokemon, 'bulbasaur')
    expect(bulbasaur.id).toBe(1)
    expect(bulbasaur.displayName).toBe('Bulbasaur')
    expect(bulbasaur.genus).toBe('Seed Pokémon')
    expect(bulbasaur.color).toBe('green')
    expect(bulbasaur.habitat).toBe('grassland')
    expect(bulbasaur.shape).toBe('quadruped')
    expect(bulbasaur.isLegendary).toBe(false)
    expect(bulbasaur.sprite).toBe(dataset.pokemon[0].images.sprite)
    expect(bulbasaur.artwork).toBe(dataset.pokemon[0].images.official_artwork)
  })

  it('removes the soft hyphens left in descriptions', () => {
    for (const p of dataset.pokemon) {
      const { description } = get(index.pokemon, p.name)
      expect(description, p.name).not.toBe('')
      expect(description, p.name).not.toContain('­')
    }
    expect(get(index.pokemon, 'rattata').description).toContain('scavenges')
  })

  it('keeps missing move values as null', () => {
    expect(get(index.moves, 'growl').power).toBeNull()
    expect(get(index.moves, 'swift').accuracy).toBeNull()
    expect(get(index.moves, 'sing').shortEffect).toBe(
      dataset.moves.find((m) => m.name === 'sing')?.short_effect,
    )
  })

  describe('links', () => {
    it("fills each move's and ability's Pokémon list from the Pokémon side", () => {
      for (const p of dataset.pokemon) {
        const pokemon = get(index.pokemon, p.name)
        for (const m of pokemon.moves) {
          expect(get(index.moves, m).learnedBy, `${m} ← ${p.name}`).toContain(
            p.name,
          )
        }
        for (const a of pokemon.abilities) {
          expect(get(index.abilities, a).pokemon, `${a} ← ${p.name}`).toContain(
            p.name,
          )
        }
      }
    })

    it("matches the dataset's own reverse lists", () => {
      for (const m of dataset.moves) {
        expect(new Set(get(index.moves, m.name).learnedBy), m.name).toEqual(
          new Set(m.learned_by_pokemon),
        )
      }
      for (const a of dataset.abilities) {
        expect(new Set(get(index.abilities, a.name).pokemon), a.name).toEqual(
          new Set(a.pokemon),
        )
      }
    })

    it('links Sing to the 6 Pokémon that learn it', () => {
      expect(new Set(get(index.moves, 'sing').learnedBy)).toEqual(
        new Set([
          'chansey',
          'clefable',
          'clefairy',
          'jigglypuff',
          'lapras',
          'wigglytuff',
        ]),
      )
    })
  })

  describe('evolution families', () => {
    it('groups the 151 Pokémon into 78 families', () => {
      const chainIds = new Set(
        dataset.pokemon.map(
          (p) => get(index.pokemon, p.name).evolution?.chainId,
        ),
      )
      expect(chainIds.size).toBe(78)
    })

    it('orders members by Pokédex number', () => {
      expect(get(index.pokemon, 'ivysaur').evolution?.members).toEqual([
        'bulbasaur',
        'ivysaur',
        'venusaur',
      ])
    })

    it("gives every member of Eevee's family the same branching family", () => {
      const eevee = get(index.pokemon, 'eevee').evolution
      expect(eevee?.members).toEqual([
        'eevee',
        'vaporeon',
        'jolteon',
        'flareon',
      ])
      expect(get(index.pokemon, 'jolteon').evolution).toEqual(eevee)
    })

    it('gives a Pokémon that does not evolve a family of one', () => {
      expect(get(index.pokemon, 'tauros').evolution?.members).toEqual([
        'tauros',
      ])
    })
  })

  describe('purity', () => {
    it('does not change its input', () => {
      const input = structuredClone(dataset)
      buildIndex(input)
      expect(input).toEqual(dataset)
    })

    it('gives the same output for the same input', () => {
      expect(buildIndex(dataset)).toEqual(buildIndex(dataset))
    })
  })
})
