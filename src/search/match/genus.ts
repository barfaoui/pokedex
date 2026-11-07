import { normalize } from '../../text/normalize'
import { KIND_WORDS } from '../vocabulary'

const wordsByGenus = new Map<string, Set<string>>()

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
