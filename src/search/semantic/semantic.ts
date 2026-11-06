import { index } from '@/data/dataset'
import type { PokedexIndex } from '@/data/types/model'
import { tagOf } from '@/search/concepts/dictionary'
import type { ConceptId } from '@/search/concepts/types'
import { isWantedDirection } from '@/search/match/concept'
import { parseQuery } from '@/search/parse'
import {
  COSINE_CEILING,
  COSINE_FLOOR,
  DESCRIPTION_WEIGHT,
  SEMANTIC_MAX_RESULTS,
  SEMANTIC_THRESHOLD,
  SEMANTIC_TOP_SCORE,
} from '@/search/scores'
import type { EmbeddedText } from '@/search/semantic/model'
import type { SearchResult } from '@/search/types/result'
import { NEGATION_WORDS } from '@/search/vocabulary'

export function rescale(cosine: number): number {
  const ratio = (cosine - COSINE_FLOOR) / (COSINE_CEILING - COSINE_FLOOR)
  return Math.min(Math.max(ratio, 0), 1) * SEMANTIC_TOP_SCORE
}

/** `vectors`: one normalised embedding per text, in the order of `texts`. */
export function semanticResults(
  query: Float32Array,
  texts: EmbeddedText[],
  vectors: Float32Array,
  pokedex: PokedexIndex = index,
): SearchResult[] {
  const best = new Map<string, { text: EmbeddedText; score: number }>()
  texts.forEach((text, row) => {
    const weight = text.source === 'description' ? DESCRIPTION_WEIGHT : 1
    const score = rescale(similarity(query, vectors, row)) * weight
    const key = `${text.kind}:${text.name}`
    if (score > (best.get(key)?.score ?? -1)) {
      best.set(key, { text, score })
    }
  })

  return [...best.values()]
    .filter(({ score }) => score >= SEMANTIC_THRESHOLD)
    .flatMap(({ text, score }) => toResult(text, score, pokedex))
    .sort((a, b) => b.score - a.score)
    .slice(0, SEMANTIC_MAX_RESULTS)
}

/**
 * The model reads "make it fall asleep" as close to Insomnia; the dictionary knows its direction.
 * A query with no concept, or with a negation, keeps every result.
 */
export function withQueryDirection(
  results: SearchResult[],
  query: string,
): SearchResult[] {
  const parsed = parseQuery(query)
  const concepts = parsed.parts.flatMap((part): ConceptId[] =>
    part.kind === 'word' && part.concept ? [part.concept] : [],
  )
  const negated = parsed.normalizedQuery
    .split(' ')
    .some((word) => NEGATION_WORDS.has(word))
  if (!concepts.length || negated) {
    return results
  }
  return results.filter((result) => {
    if (result.kind === 'pokemon') {
      return true
    }
    const tagged = concepts.flatMap((concept) => {
      const tag = tagOf(concept, result.kind, result.item.name)
      return tag ? [{ concept, tag }] : []
    })
    return (
      !tagged.length ||
      tagged.some(({ concept, tag }) => isWantedDirection(concept, tag))
    )
  })
}

export function withSemanticResults(
  manual: SearchResult[],
  semantic: SearchResult[],
): SearchResult[] {
  if (!semantic.length) {
    return manual
  }
  const best = new Map<string, SearchResult>()
  for (const result of [...manual, ...semantic]) {
    const key = `${result.kind}:${result.item.name}`
    if (result.score > (best.get(key)?.score ?? -1)) {
      best.set(key, result)
    }
  }
  return [...best.values()].sort((a, b) => b.score - a.score)
}

// The vectors are normalised, so the dot product is the cosine.
function similarity(query: Float32Array, vectors: Float32Array, row: number) {
  const start = row * query.length
  let sum = 0
  for (let dimension = 0; dimension < query.length; dimension++) {
    sum += query[dimension] * vectors[start + dimension]
  }
  return sum
}

function toResult(
  text: EmbeddedText,
  score: number,
  pokedex: PokedexIndex,
): SearchResult[] {
  switch (text.kind) {
    case 'pokemon': {
      const item = pokedex.pokemon.get(text.name)
      return item
        ? [
            {
              kind: 'pokemon',
              item,
              score,
              matched: [{ field: 'description', value: item.description }],
            },
          ]
        : []
    }
    case 'move': {
      const item = pokedex.moves.get(text.name)
      return item
        ? [
            {
              kind: 'move',
              item,
              score,
              matched: [{ field: 'effect', value: item.shortEffect }],
            },
          ]
        : []
    }
    case 'ability': {
      const item = pokedex.abilities.get(text.name)
      return item
        ? [
            {
              kind: 'ability',
              item,
              score,
              matched: [{ field: 'effect', value: item.shortEffect }],
            },
          ]
        : []
    }
  }
}
