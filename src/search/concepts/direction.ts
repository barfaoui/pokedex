import type { Concept, ConceptTag, Direction } from './types.ts'

export type ItemTag = Pick<ConceptTag, 'direction' | 'evidence' | 'source'>

// Rule vocabulary, in the order the rules are tried.

// Sentences that only name the concept in passing are skipped: without this,
// "cannot be selected by Sleep Talk" would read as "prevents sleep".
const MENTIONS = [
  /\bselected by\b/i,
  /\bcopied by\b/i,
  /\bfull list\b/i,
  /^for example\b/i,
  /^an? (extra effect|effect chance)\b/i,
]

const PREVENT_WORDS =
  'prevents?|cannot(?: be)?|protects? against|blocks?|immune to'

// "the user", but not "the move's user" (the attacker hit by a contact ability).
const SELF = /(?<!move's )\buser\b/i

const AFFECTED_WORDS = 'during|when|whenever|while|upon|only works on'

const INFLICTS =
  /\b(?:puts?|summons|chance (?:to|of)|the target|weather changes to)\b|(?<!self-)\binflict\w*|\binflct\w*/i

// Weather only: an "affected" clause with one of these benefits from the weather.
const POSITIVE =
  /\b(?:doubles?|increases?|raises?|heals?|cures?|restores?|protects?|strengthens?|boosts?|skipped)\b|100%/i

/** Short effect first, then full effect: the first sentence with a clear direction decides. */
export function tagItem(
  shortEffect: string,
  effect: string,
  concept: Concept,
): ItemTag | undefined {
  const classified = [
    ...sentencesOf(shortEffect, 'short_effect'),
    ...sentencesOf(effect, 'effect'),
  ].flatMap(({ sentence, source }) => {
    const direction = classifySentence(sentence, concept)
    return direction ? [{ direction, evidence: sentence, source }] : []
  })
  return classified.find((t) => t.direction !== 'unclear') ?? classified[0]
}

/**
 * Undefined when the concept only appears in passing. For weather, "inflicts" becomes
 * "starts", and "affected" becomes "benefits" when the clause is positive.
 */
export function classifySentence(
  sentence: string,
  concept: Concept,
): Direction | undefined {
  const root = rootPattern(concept.roots)
  if (!wholeWord(root).test(sentence) || mentions(sentence, root)) {
    return undefined
  }
  const direction = baseDirection(sentence, root)
  return concept.group === 'weather'
    ? weatherDirection(direction, sentence, root)
    : direction
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

// Longest roots first, so "rain dance" is tried before "rain".
function rootPattern(roots: string[]): string {
  const escaped = [...roots]
    .sort((a, b) => b.length - a.length)
    .map((root) => root.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  return `(?:${escaped.join('|')})`
}

function wholeWord(root: string): RegExp {
  return new RegExp(`\\b${root}\\b`, 'i')
}

/** Shared by every concept; the first that fits wins. */
function baseDirection(sentence: string, root: string): Direction {
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

function weatherDirection(
  direction: Direction,
  sentence: string,
  root: string,
): Direction {
  if (direction === 'inflicts') {
    return 'starts'
  }
  if (direction === 'affected') {
    return POSITIVE.test(clauseWith(sentence, root)) ? 'benefits' : 'affected'
  }
  return direction
}

// "Causes damage during strong sunlight, but heals during rain": each weather gets its own clause.
function clauseWith(sentence: string, root: string): string {
  return (
    sentence
      .split(/,\s*but\s+|;\s*/)
      .find((clause) => wholeWord(root).test(clause)) ?? sentence
  )
}
