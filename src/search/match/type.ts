import { POKEMON_TYPES, type PokemonType } from '../../data/types/model'
import { typoScore } from '../typo'

// "fight", "elec": the start of a type name is a deliberate short form, so it scores just under
// the full name. Fewer than 4 letters would be too ambiguous ("gr": grass or ground).
const MIN_PREFIX_LENGTH = 4
const PREFIX_SCORE = 0.95

export function matchType(
  word: string,
): { value: PokemonType; score: number } | undefined {
  let best: { value: PokemonType; score: number } | undefined
  for (const type of POKEMON_TYPES) {
    const prefix =
      word.length >= MIN_PREFIX_LENGTH && type.startsWith(word)
        ? PREFIX_SCORE
        : 0
    const score = Math.max(typoScore(word, type), prefix)
    if (score > (best?.score ?? 0)) {
      best = { value: type, score }
    }
  }
  return best
}
