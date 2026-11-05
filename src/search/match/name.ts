import { typoScore } from '../typo'

const MIN_ANYWHERE_LENGTH = 3
const MIN_SHORT_PREFIX_LENGTH = 3

/**
 * `anywhere: false` only matches from the start of the name, so "rain" never matches "Mega Drain".
 * `shortPrefix: false` needs 3 letters to match the start of a name: in "weather in paris", "in"
 * would otherwise find Insomnia. Typed alone, "ab" still finds Abra.
 */
export function nameScore(
  part: string,
  name: string,
  { anywhere = true, shortPrefix = true } = {},
): number {
  if (part === name) {
    return 1
  }
  const cover = part.length / name.length
  const prefixLongEnough = shortPrefix || part.length >= MIN_SHORT_PREFIX_LENGTH
  if (prefixLongEnough && name.startsWith(part)) {
    return 0.7 + 0.3 * cover
  }
  if (anywhere && part.length >= MIN_ANYWHERE_LENGTH && name.includes(part)) {
    return 0.5 + 0.3 * cover
  }
  return typoScore(part, name)
}
