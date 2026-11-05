import { matchDescriptor } from './match/descriptor'
import { matchType } from './match/type'
import { normalize } from '../text/normalize'
import type {
  FamilyDirection,
  ParsedQuery,
  StatPart,
  WordPart,
} from './types/query'
import type { ResultKind } from './types/result'
import {
  ABILITY_HINT,
  COMPARATIVE_WORDS,
  COMPARISON_WORDS,
  CONCEPT_WORDS,
  DESCRIPTORS,
  FAMILY_DIRECTION_WORDS,
  FAMILY_INTO_WORD,
  FAMILY_WORDS,
  FILLER_WORDS,
  HAVE_WORDS,
  KIND_WORDS,
  LEARN_WORDS,
  NEGATING_WORDS,
  SEGMENT_END_WORD,
  SORT_WORDS,
  STAT_WORDS,
  UNITS,
} from './vocabulary'

interface Read<T> {
  value: T
  length: number
}

/** Only the first sort word sorts; later ones are kept as words. */
export function parseQuery(query: string): ParsedQuery {
  const { searched, excluded } = splitExclusions(
    normalize(spellOutOperators(query))
      .split(' ')
      .filter(Boolean)
      .flatMap(splitUnit),
  )
  // With a negation, filler and kind words alone ("pokemon not electric") have nothing to
  // search: a lone negation, listing the named kind.
  const lone = !!excluded && !searched.some(isSearched)
  const typed = lone ? [] : searched
  const hasFamilyWord = typed.some((word) => FAMILY_WORDS.has(word))
  const named = kindsOf(searched)
  const learners = asksForLearners(typed, named)
  const asked = typed.filter(
    (word) =>
      !KIND_WORDS.has(word) &&
      !FAMILY_WORDS.has(word) &&
      !(hasFamilyWord && isFamilyDirectionWord(word)) &&
      !(learners && (LEARN_WORDS.has(word) || HAVE_WORDS.has(word))),
  )
  const words = withoutFiller(asked.length ? asked : typed)
  // A lone family word ("evolution") is searched as a word, it names no one's family.
  const family =
    asked.length > 0 && hasFamilyWord ? familyDirection(typed) : undefined
  const kinds: ResultKind[] = learners && !named.length ? ['pokemon'] : named
  const parsed: ParsedQuery = {
    parts: [],
    normalizedQuery: typed.join(' '),
    // A lone kind word ("pokemon") is searched as a word, it has nothing to rank.
    ...(kinds.length && (lone || words.some(isSearched)) && { kinds }),
    ...(excluded && { excluded }),
    ...(family && { family }),
    ...(learners && { learners }),
  }
  let i = 0
  while (i < words.length) {
    const sort = readPhrase(SORT_WORDS, words, i)
    if (sort && !parsed.sort) {
      parsed.sort = {
        word: words.slice(i, i + sort.length).join(' '),
        ...sort.value,
      }
      i += sort.length
      continue
    }
    const part = readStatCondition(words, i) ?? readWord(words, i)
    parsed.parts.push(part.value)
    i += part.length
  }
  return parsed
}

/**
 * Everything after "not" or "no", up to "and" or the end, is excluded; the rest is searched.
 * A kind word always names the kind: "not electric pokemon" excludes Electric, not Pokémon.
 * `excluded` holds each segment's words, filler dropped; it is set whenever a negation is typed.
 */
export function splitExclusions(typed: string[]): {
  searched: string[]
  excluded?: string[][]
} {
  const searched: string[] = []
  let excluded: string[][] | undefined
  let segment: string[] | undefined
  for (const word of typed) {
    if (NEGATING_WORDS.has(word)) {
      segment = []
      excluded = [...(excluded ?? []), segment]
    } else if (word === SEGMENT_END_WORD) {
      segment = undefined
    } else if (segment && !KIND_WORDS.has(word)) {
      if (!FILLER_WORDS.has(word)) {
        segment.push(word)
      }
    } else {
      searched.push(word)
    }
  }
  return { searched, ...(excluded && { excluded }) }
}

/** A learn word, unless the query names another kind ("what moves can pikachu learn"). */
function asksForLearners(typed: string[], named: ResultKind[]): boolean {
  const forPokemon = !named.length || named.includes('pokemon')
  return (
    (forPokemon && typed.some((word) => LEARN_WORDS.has(word))) ||
    (named.includes('pokemon') && typed.some((word) => HAVE_WORDS.has(word)))
  )
}

function isFamilyDirectionWord(word: string): boolean {
  return FAMILY_DIRECTION_WORDS.has(word) || word === FAMILY_INTO_WORD
}

function familyDirection(typed: string[]): FamilyDirection {
  const stated = typed.flatMap((word) => FAMILY_DIRECTION_WORDS.get(word) ?? [])
  if (stated.length) {
    return stated[0]
  }
  const into = typed.indexOf(FAMILY_INTO_WORD)
  const named = typed
    .slice(into + 1)
    .some((word) => isSearched(word) && !FAMILY_WORDS.has(word))
  return into >= 0 && named ? 'earlier' : 'later'
}

function kindsOf(typed: string[]): ResultKind[] {
  const named = [
    ...new Set(typed.flatMap((word) => KIND_WORDS.get(word) ?? [])),
  ]
  if (named.length) {
    return named
  }
  return typed.includes(ABILITY_HINT) ? ['ability'] : []
}

function isSearched(word: string): boolean {
  return !FILLER_WORDS.has(word) && !KIND_WORDS.has(word)
}

/** Filler words are kept when nothing else is left. */
function withoutFiller(words: string[]): string[] {
  const meaningful = words.filter((word) => !FILLER_WORDS.has(word))
  return meaningful.length ? meaningful : words
}

function spellOutOperators(query: string): string {
  return (
    query
      .replace(/>=/g, ' atleast ')
      .replace(/<=/g, ' atmost ')
      .replace(/>/g, ' over ')
      .replace(/</g, ' under ')
      // Pokémon GO: "@surf" lists the Pokémon that know Surf
      .replace(/@/g, ' learns ')
      // Pokémon GO: "water & !ice"
      .replace(/!/g, ' not ')
      .replace(/&/g, ' and ')
  )
}

const NUMBER = /^\d+(?:\.\d+)?$/

/** "90kg" is typed as one word: the number and its unit. */
function splitUnit(word: string): string[] {
  const glued = /^(\d+(?:\.\d+)?)([a-z]+)$/.exec(word)
  return glued && UNITS.has(glued[2]) ? [glued[1], glued[2]] : [word]
}

/**
 * "attack over 100", "heavier than 200 kg", "over 2 m", or a bare measure ("90 kg", read as
 * about 90 kg). A unit names the stat when nothing else does, and converts the number.
 */
function readStatCondition(
  words: string[],
  start: number,
): Read<StatPart> | undefined {
  const comparative = readPhrase(COMPARATIVE_WORDS, words, start)
  const stat = comparative ? undefined : readPhrase(STAT_WORDS, words, start)
  let at = start + (comparative?.length ?? stat?.length ?? 0)
  const comparison = comparative
    ? undefined
    : readPhrase(COMPARISON_WORDS, words, at)
  if (stat && !comparison) {
    return undefined
  }
  at += comparison?.length ?? 0
  const number = words[at]
  if (!number || !NUMBER.test(number)) {
    return undefined
  }
  const named = comparative?.value.stat ?? stat?.value
  const unit = UNITS.get(words[at + 1] ?? '')
  const fits = unit && (!named || named === unit.stat)
  const conditionStat = named ?? (fits ? unit.stat : undefined)
  // A lone number is a Pokédex number ("pokemon 150"), never a condition.
  if (!conditionStat) {
    return undefined
  }
  return {
    value: {
      kind: 'stat',
      stat: conditionStat,
      comparison: comparative?.value.comparison ?? comparison?.value ?? 'about',
      value: Number(number) * (fits ? unit.factor : 1),
    },
    length: at + (fits ? 2 : 1) - start,
  }
}

/** A word, or a two-word descriptor ("waters edge"); its text is still matched against names. */
function readWord(words: string[], start: number): Read<WordPart> {
  const phrase = readPhrase(DESCRIPTORS, words, start)
  const length = phrase?.length ?? 1
  const text = words.slice(start, start + length).join(' ')
  const descriptor = phrase
    ? { value: phrase.value, score: 1 }
    : matchDescriptor(text)
  const type = matchType(text)
  const concept = CONCEPT_WORDS.get(text)
  const number = /^\d+$/.test(text) ? Number(text) : undefined
  return {
    value: {
      kind: 'word',
      text,
      ...(type && { type }),
      ...(descriptor && { descriptor }),
      ...(concept && { concept }),
      ...(number !== undefined && { number }),
    },
    length,
  }
}

/** Tries longer phrases first, so "special attack" wins over "special". */
export function readPhrase<T>(
  phrases: Map<string, T>,
  words: string[],
  start: number,
): Read<T> | undefined {
  // Three words for "high special attack".
  for (const length of [3, 2, 1]) {
    if (start + length > words.length) {
      continue
    }
    const value = phrases.get(words.slice(start, start + length).join(' '))
    if (value !== undefined) {
      return { value, length }
    }
  }
  return undefined
}
