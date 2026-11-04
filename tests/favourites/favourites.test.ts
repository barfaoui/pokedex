import { describe, expect, test } from 'vitest'
import {
  parseFavourites,
  toggleFavourite,
} from '../../src/favourites/favourites'

describe('parseFavourites', () => {
  test('reads the stored list of Pokémon names', () => {
    expect(parseFavourites('["pikachu","eevee"]')).toEqual(['pikachu', 'eevee'])
  })

  test('nothing stored, broken JSON or the wrong shape is an empty list', () => {
    expect(parseFavourites(null)).toEqual([])
    expect(parseFavourites('{not json')).toEqual([])
    expect(parseFavourites('{"pikachu":true}')).toEqual([])
  })

  test('drops entries that are not names', () => {
    expect(parseFavourites('["pikachu",3,null]')).toEqual(['pikachu'])
  })
})

describe('toggleFavourite', () => {
  test('adds a Pokémon that is not a favourite yet, at the end', () => {
    expect(toggleFavourite(['eevee'], 'pikachu')).toEqual(['eevee', 'pikachu'])
  })

  test('removes a Pokémon that is already a favourite', () => {
    expect(toggleFavourite(['eevee', 'pikachu'], 'eevee')).toEqual(['pikachu'])
  })
})
