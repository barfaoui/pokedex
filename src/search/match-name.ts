import { editDistance, typoLimit } from './typo'

const MIN_ANYWHERE_LENGTH = 3

export function nameScore(part: string, name: string): number {
  if (part === name) {
    return 1
  }
  const cover = part.length / name.length
  if (name.startsWith(part)) {
    return 0.7 + 0.3 * cover
  }
  if (part.length >= MIN_ANYWHERE_LENGTH && name.includes(part)) {
    return 0.5 + 0.3 * cover
  }
  return typoScore(part, name)
}

function typoScore(part: string, name: string): number {
  const changes = editDistance(part, name)
  return changes <= typoLimit(name.length) ? 1 - changes / name.length : 0
}
