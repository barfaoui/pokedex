import { POKEMON_TYPES, type PokemonType } from '../../data/types/model'
import { editDistance, typoLimit } from '../typo'

// "fight", "elec": the start of a type name is a deliberate short form, so it scores just under
// the full name. Fewer than 4 letters would be too ambiguous ("gr": grass or ground).
const MIN_PREFIX_LENGTH = 4
const PREFIX_SCORE = 0.95

/**
 * The type a word most likely means: the full name, its start (4+ letters), or a typo within
 * 30% of the type's length.
 */
export function matchType(
  word: string,
): { value: PokemonType; score: number } | undefined {
  let best: { value: PokemonType; score: number } | undefined
  for (const type of POKEMON_TYPES) {
    const score = typeScore(word, type)
    if (score > (best?.score ?? 0)) {
      best = { value: type, score }
    }
  }
  return best
}

function typeScore(word: string, type: PokemonType): number {
  if (word === type) {
    return 1
  }
  const changes = editDistance(word, type)
  const typo = changes <= typoLimit(type.length) ? 1 - changes / type.length : 0
  const prefix =
    word.length >= MIN_PREFIX_LENGTH && type.startsWith(word) ? PREFIX_SCORE : 0
  return Math.max(typo, prefix)
}
