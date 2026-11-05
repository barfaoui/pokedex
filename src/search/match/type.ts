import { POKEMON_TYPES, type PokemonType } from '../../data/types/model'
import { closeScore } from '../typo'

export function matchType(
  word: string,
): { value: PokemonType; score: number } | undefined {
  let best: { value: PokemonType; score: number } | undefined
  for (const type of POKEMON_TYPES) {
    const score = closeScore(word, type)
    if (score > (best?.score ?? 0)) {
      best = { value: type, score }
    }
  }
  return best
}
