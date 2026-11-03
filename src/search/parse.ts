import { matchType } from './match-type'
import { normalize } from './normalize'
import type { ParsedQuery, StatPart, WordPart } from './types/query'
import {
  COMPARISON_WORDS,
  CONCEPT_WORDS,
  DESCRIPTORS,
  FILLER_WORDS,
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
  const words = withoutFiller(
    normalize(spellOutOperators(query)).split(' ').filter(Boolean),
  )
  const parsed: ParsedQuery = { parts: [] }
  let i = 0
  while (i < words.length) {
    const sort = SORT_WORDS.get(words[i])
    if (sort && !parsed.sort) {
      parsed.sort = { word: words[i], ...sort }
      i += 1
      continue
    }
    const part = readStatCondition(words, i) ?? readWord(words, i)
    parsed.parts.push(part.value)
    i += part.length
  }
  return parsed
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
  if (!value || !/^\d+$/.test(value)) {
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

/** Tries two-word phrases first, so "special attack" wins over "special". */
function readPhrase<T>(
  phrases: Map<string, T>,
  words: string[],
  start: number,
): Read<T> | undefined {
  for (const length of [2, 1]) {
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
