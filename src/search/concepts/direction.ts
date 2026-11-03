import type { ConceptTag, Direction } from './types.ts'

export type ItemTag = Pick<ConceptTag, 'direction' | 'evidence' | 'source'>

/**
 * The direction a sentence gives a concept, or undefined when none of the
 * roots appears in it as a whole word. Rules are tried in order; the first
 * that fits wins.
 */
export function classifySentence(
  sentence: string,
  roots: string[],
): Direction | undefined {
  const root = rootPattern(roots)
  if (!new RegExp(`\\b${root}\\b`, 'i').test(sentence)) {
    return undefined
  }
  if (mentions(sentence, root)) {
    return 'mentions'
  }
  if (followedByRoot(PREVENT_WORDS, root).test(sentence)) {
    return 'prevents'
  }
  if (SELF.test(sentence)) {
    return 'self'
  }
  if (followedByRoot(AFFECTED_WORDS, root).test(sentence)) {
    return 'affected'
  }
  if (INFLICTS.test(sentence)) {
    return 'inflicts'
  }
  return 'unclear'
}

/**
 * Tags a move or ability for a concept: its short effect is read first, then
 * its full effect. The first sentence with a clear direction decides and is
 * kept as evidence; otherwise the item is unclear, or only mentions it.
 */
export function tagItem(
  shortEffect: string,
  effect: string,
  roots: string[],
): ItemTag | undefined {
  const classified = [
    ...sentencesOf(shortEffect, 'short_effect'),
    ...sentencesOf(effect, 'effect'),
  ].flatMap(({ sentence, source }) => {
    const direction = classifySentence(sentence, roots)
    return direction ? [{ direction, evidence: sentence, source }] : []
  })
  return (
    classified.find((t) => !UNDECIDED.includes(t.direction)) ??
    classified.find((t) => t.direction === 'unclear') ??
    classified[0]
  )
}

const UNDECIDED: Direction[] = ['mentions', 'unclear']

const MENTIONS = [
  /\bselected by\b/i,
  /\bcopied by\b/i,
  /\bfull list\b/i,
  /^for example\b/i,
  /^an? (extra effect|effect chance)\b/i,
]

const PREVENT_WORDS =
  'prevents?|cannot(?: be)?|protects? against|blocks?|immune to'

const AFFECTED_WORDS = 'during|when|whenever|while|upon|only works on'

// "the user", but not "the move's user" (the attacker hit by a contact ability).
const SELF = /(?<!move's )\buser\b/i

const INFLICTS =
  /\b(?:puts?|summons|chance (?:to|of)|the target|weather changes to)\b|(?<!self-)\binflict\w*|\binflct\w*/i

function mentions(sentence: string, root: string): boolean {
  return (
    MENTIONS.some((pattern) => pattern.test(sentence)) ||
    new RegExp(`\\b${root}-type\\b`, 'i').test(sentence)
  )
}

// The word, then the root within three words: "prevents this Pokémon from sleeping".
function followedByRoot(words: string, root: string): RegExp {
  return new RegExp(`\\b(?:${words})(?:\\s+\\S+){0,3}?\\s+${root}\\b`, 'i')
}

// Longest roots first, so "rain dance" is tried before "rain".
function rootPattern(roots: string[]): string {
  const escaped = [...roots]
    .sort((a, b) => b.length - a.length)
    .map((root) => root.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  return `(?:${escaped.join('|')})`
}

function sentencesOf(
  text: string,
  source: ConceptTag['source'],
): { sentence: string; source: ConceptTag['source'] }[] {
  return text
    .replace(/\s+/g, ' ')
    .trim()
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .map((sentence) => ({ sentence, source }))
}
