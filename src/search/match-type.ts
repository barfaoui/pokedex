import { POKEMON_TYPES, type PokemonType } from '../data/types/model'
import { editDistance, typoLimit } from './typo'

/** The type a word most likely means, allowing typos within 30% of the type's length. */
export function matchType(
  word: string,
): { value: PokemonType; score: number } | undefined {
  let best: { value: PokemonType; score: number } | undefined
  for (const type of POKEMON_TYPES) {
    const changes = editDistance(word, type)
    const score = 1 - changes / type.length
    if (changes <= typoLimit(type.length) && score > (best?.score ?? 0)) {
      best = { value: type, score }
    }
  }
  return best
}
