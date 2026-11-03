import { nameScore } from './match-name'

// Each part is scored on its own (averaged), and the whole query as one phrase
// so multi-word names like "mr mime" can still match exactly.
export function scoreName(parts: string[], searchName: string): number {
  const average =
    parts.reduce((sum, part) => sum + nameScore(part, searchName), 0) /
    parts.length
  const phrase = nameScore(parts.join(' '), searchName)
  return Math.max(average, phrase)
}
