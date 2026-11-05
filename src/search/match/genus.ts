import { normalize } from '../../text/normalize'
import { KIND_WORDS } from '../vocabulary'

const wordsByGenus = new Map<string, Set<string>>()

/**
 * 1 when the word is a whole word of the category ("Mouse Pokémon"), else 0: a part of one
 * ("shell" in Shellfish) or a typo would let everyday words reach unrelated Pokémon.
 */
export function genusScore(word: string, genus: string): number {
  let words = wordsByGenus.get(genus)
  if (!words) {
    words = new Set(
      normalize(genus)
        .split(' ')
        .filter((part) => !KIND_WORDS.has(part)),
    )
    wordsByGenus.set(genus, words)
  }
  return words.has(word) ? 1 : 0
}
