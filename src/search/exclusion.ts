import type { PokedexIndex, PokemonType } from '../data/types/model'
import { tagOf } from './concepts/dictionary'
import type { ConceptId } from './concepts/types'
import { isWantedDirection } from './match/concept'
import { matchDescriptor } from './match/descriptor'
import { matchType } from './match/type'
import { readPhrase } from './parse'
import type { Descriptor, ParsedQuery } from './types/query'
import type { SearchResult } from './types/result'
import { CONCEPT_WORDS, DESCRIPTORS } from './vocabulary'

export type Exclusion =
  | { kind: 'type'; value: PokemonType }
  | { kind: 'descriptor'; descriptor: Descriptor }
  | { kind: 'concept'; concept: ConceptId; word: string }
  | { kind: 'name'; searchName: string; name: string }

export interface Exclusions {
  rules: Exclusion[]
  /** Excluded words that are nothing excludable: shown, but they remove nothing. */
  unknown: string[]
}

export const NO_EXCLUSIONS: Exclusions = { rules: [], unknown: [] }

export function exclusionsOf(
  parsed: ParsedQuery,
  pokedex: PokedexIndex,
): Exclusions {
  const rules: Exclusion[] = []
  const unknown: string[] = []
  for (const segment of parsed.excluded ?? []) {
    // A whole name first: "not mr mime" is one Pokémon, not "mr" and "mime".
    const whole = nameRule(segment.join(' '), pokedex)
    if (segment.length > 1 && whole) {
      rules.push(whole)
      continue
    }
    let i = 0
    while (i < segment.length) {
      const descriptor = readPhrase(DESCRIPTORS, segment, i)
      const length = descriptor?.length ?? 1
      const word = segment.slice(i, i + length).join(' ')
      const found = rulesFor(
        word,
        descriptor?.value ?? matchDescriptor(word)?.value,
        pokedex,
      )
      if (found.length) {
        rules.push(...found)
      } else {
        unknown.push(word)
      }
      i += length
    }
  }
  return { rules, unknown }
}

/** The others keep their score. */
export function withoutExcluded(
  results: SearchResult[],
  rules: Exclusion[],
): SearchResult[] {
  return rules.length
    ? results.filter((result) => !rules.some((rule) => excludes(rule, result)))
    : results
}

// A word can be several things at once ("psychic": a type and a move): each one excludes.
function rulesFor(
  word: string,
  descriptor: Descriptor | undefined,
  pokedex: PokedexIndex,
): Exclusion[] {
  const type = matchType(word)
  const concept = CONCEPT_WORDS.get(word)
  const name = nameRule(word, pokedex)
  return [
    ...(type ? [{ kind: 'type' as const, value: type.value }] : []),
    ...(descriptor ? [{ kind: 'descriptor' as const, descriptor }] : []),
    ...(concept ? [{ kind: 'concept' as const, concept, word }] : []),
    ...(name ? [name] : []),
  ]
}

function nameRule(
  searchName: string,
  pokedex: PokedexIndex,
): Exclusion | undefined {
  const item = [
    ...pokedex.pokemon.values(),
    ...pokedex.moves.values(),
    ...pokedex.abilities.values(),
  ].find((candidate) => candidate.searchName === searchName)
  return item && { kind: 'name', searchName, name: item.name }
}

function excludes(rule: Exclusion, result: SearchResult): boolean {
  switch (rule.kind) {
    case 'type':
      return result.kind === 'pokemon'
        ? result.item.types.includes(rule.value)
        : result.kind === 'move' && result.item.type === rule.value
    case 'descriptor':
      return (
        result.kind === 'pokemon' &&
        result.item[rule.descriptor.field] === rule.descriptor.value
      )
    // Moves and abilities only: almost every Pokémon learns a move that burns or poisons.
    case 'concept': {
      if (result.kind === 'pokemon') {
        return false
      }
      const tag = tagOf(rule.concept, result.kind, result.item.name)
      return !!tag && isWantedDirection(rule.concept, tag)
    }
    case 'name':
      return result.item.searchName === rule.searchName
  }
}
