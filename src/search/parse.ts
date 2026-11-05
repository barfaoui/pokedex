import { matchType } from './match/type'
import { normalize } from '../text/normalize'
import type { ParsedQuery, StatPart, WordPart } from './types/query'
import type { ResultKind } from './types/result'
import {
  ABILITY_HINT,
  COMPARISON_WORDS,
  CONCEPT_WORDS,
  DESCRIPTORS,
  FILLER_WORDS,
  KIND_WORDS,
  NEGATING_WORDS,
  SEGMENT_END_WORD,
  SORT_WORDS,
  STAT_WORDS,
} from './vocabulary'

interface Read<T> {
  value: T
  length: number
}

/**
 * Splits a query into the parts that get scored (stat conditions, and words
 * with the type or descriptor they may mean) and an optional sort word.
 * Only the first sort word sorts; later ones are kept as words.
 */
export function parseQuery(query: string): ParsedQuery {
  const { searched, excluded } = splitExclusions(
    normalize(spellOutOperators(query)).split(' ').filter(Boolean),
  )
  // With a negation, filler and kind words alone ("pokemon not electric") have nothing to
  // search: a lone negation, listing the named kind.
  const lone = !!excluded && !searched.some(isSearched)
  const typed = lone ? [] : searched
  const asked = typed.filter((word) => !KIND_WORDS.has(word))
  const words = withoutFiller(asked.length ? asked : typed)
  const kinds = kindsOf(searched)
  const parsed: ParsedQuery = {
    parts: [],
    normalizedQuery: typed.join(' '),
    // A lone kind word ("pokemon") is searched as a word, it has nothing to rank.
    ...(kinds.length && (lone || words.some(isSearched)) && { kinds }),
    ...(excluded && { excluded }),
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

/** Drops filler words ("put my opponent to"), unless nothing else is left. */
function withoutFiller(words: string[]): string[] {
  const meaningful = words.filter((word) => !FILLER_WORDS.has(word))
  return meaningful.length ? meaningful : words
}

function spellOutOperators(query: string): string {
  return query
    .replace(/>=/g, ' atleast ')
    .replace(/<=/g, ' atmost ')
    .replace(/>/g, ' over ')
    .replace(/</g, ' under ')
}

/** Reads "<stat> <comparison> <number>" (e.g. "speed over 150") at `start`, or nothing if the words don't form one. */
function readStatCondition(
  words: string[],
  start: number,
): Read<StatPart> | undefined {
  const stat = readPhrase(STAT_WORDS, words, start)
  const comparison =
    stat && readPhrase(COMPARISON_WORDS, words, start + stat.length)
  if (!stat || !comparison) {
    return undefined
  }
  const end = start + stat.length + comparison.length
  const value = words[end]
  if (!value || !/^\d+(?:\.\d+)?$/.test(value)) {
    return undefined
  }
  return {
    value: {
      kind: 'stat',
      stat: stat.value,
      comparison: comparison.value,
      value: Number(value),
    },
    length: end - start + 1,
  }
}

/**
 * Reads one word, or a two-word descriptor such as "waters edge", with the
 * type and descriptor it may mean. Its text is still matched against names.
 */
function readWord(words: string[], start: number): Read<WordPart> {
  const descriptor = readPhrase(DESCRIPTORS, words, start)
  const length = descriptor?.length ?? 1
  const text = words.slice(start, start + length).join(' ')
  const type = matchType(text)
  const concept = CONCEPT_WORDS.get(text)
  return {
    value: {
      kind: 'word',
      text,
      ...(type && { type }),
      ...(descriptor && { descriptor: descriptor.value }),
      ...(concept && { concept }),
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
