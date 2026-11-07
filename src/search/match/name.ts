import {
  MIN_ANYWHERE_LENGTH,
  MIN_SHORT_PREFIX_LENGTH,
  NAME_ANYWHERE_SCORE,
  NAME_COVER_WEIGHT,
  NAME_START_SCORE,
} from '../scores'
import { typoScore } from '../typo'

// `anywhere: false`, so "rain" never matches "Mega Drain". `shortPrefix: false` needs 3 letters, so
// "in" in "weather in paris" doesn't find Insomnia; typed alone, "ab" still finds Abra.
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
    return NAME_START_SCORE + NAME_COVER_WEIGHT * cover
  }
  if (anywhere && part.length >= MIN_ANYWHERE_LENGTH && name.includes(part)) {
    return NAME_ANYWHERE_SCORE + NAME_COVER_WEIGHT * cover
  }
  return typoScore(part, name)
}
