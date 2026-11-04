import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { env, pipeline } from '@huggingface/transformers'
import { withoutExcluded } from '@/search/exclusion'
import {
  needsSemantic,
  queryExclusions,
  search,
  semanticQueryOf,
} from '@/search/search'
import {
  EMBED_OPTIONS,
  MODEL_DTYPE,
  MODEL_ID,
  type EmbeddedText,
} from '@/search/semantic/model'
import {
  DESCRIPTION_WEIGHT,
  rescale,
  semanticResults,
  withQueryDirection,
  withSemanticResults,
} from '@/search/semantic/semantic'
import type { ResultKind, SearchResult } from '@/search/types/result'
import type { EvalQuery, Expectation, Key } from './queries'

const MANUAL_RUNS = 20
const SEMANTIC_RUNS = 5

export type Layer =
  | 'manual (confident)'
  | 'manual (weak)'
  | 'semantic'
  | 'manual + semantic'
  | 'none'

export interface Check {
  passed: boolean
  /** 1-based rank of the first expected result, null if none was found or none expected. */
  firstRank: number | null
  /** The same, in the tab of that result's kind (Pokémon, Moves, Abilities). */
  firstRankInTab: { rank: number; kind: ResultKind } | null
  expectedCount: number
  missing: Key[]
  falsePositives: string[]
  notes: string[]
  /** Order, kept apart from `passed`: the first expected result is in the top 3 of the All
   * tab, and the kind the query names comes first. null when nothing is expected. */
  orderPassed: boolean | null
  orderNotes: string[]
}

export interface ItemCosine {
  key: Key
  cosine: number
  /** 0–1 after rescaling and the description weight: what the floor is compared to. */
  score: number
  source: EmbeddedText['source']
  /** 1-based rank among every item, by semantic score. */
  rank: number
}

export interface Outcome {
  query: EvalQuery
  results: SearchResult[]
  fromSemantic: boolean[]
  layer: Layer
  bestManual: number
  triggered: boolean
  check: Check
  /** Computed for every query, even when the app wouldn't run semantic search. */
  cosine: { top: ItemCosine; expected: ItemCosine[] }
  manualMs: number[]
  semanticMs: number[]
}

export interface EvalRun {
  outcomes: Outcome[]
  modelLoadMs: number
  firstEmbedMs: number
  networkRequests: string[]
}

export function keyOf(result: SearchResult): Key {
  return `${result.kind}:${result.item.name}`
}

export async function runEval(queries: EvalQuery[]): Promise<EvalRun> {
  const networkRequests: string[] = []
  const realFetch = globalThis.fetch
  // Proves the cost claim: any request, even to Hugging Face for the model, shows in the report.
  globalThis.fetch = (input, init) => {
    networkRequests.push(input instanceof Request ? input.url : String(input))
    return realFetch(input, init)
  }

  try {
    env.allowRemoteModels = false
    env.localModelPath = fileURLToPath(
      new URL('../../public/models/', import.meta.url),
    )
    const texts = JSON.parse(
      readFileSync(
        new URL('../../public/semantic/texts.json', import.meta.url),
        'utf8',
      ),
    ) as EmbeddedText[]
    const bytes = readFileSync(
      new URL('../../public/semantic/embeddings.bin', import.meta.url),
    )
    const vectors = new Float32Array(
      bytes.buffer,
      bytes.byteOffset,
      bytes.byteLength / Float32Array.BYTES_PER_ELEMENT,
    )

    let start = performance.now()
    const extractor = await pipeline('feature-extraction', MODEL_ID, {
      dtype: MODEL_DTYPE,
    })
    const modelLoadMs = performance.now() - start
    const embed = async (query: string) =>
      (await extractor(query, EMBED_OPTIONS)).data as Float32Array

    start = performance.now()
    await embed('warm up')
    const firstEmbedMs = performance.now() - start

    const outcomes: Outcome[] = []
    for (const query of queries) {
      const manual = search(query.query)
      const semanticQuery = semanticQueryOf(query.query)
      const triggered = semanticQuery !== '' && needsSemantic(manual)
      const vector = await embed(semanticQuery || query.query)
      const semantic = triggered
        ? withQueryDirection(
            semanticResults(vector, texts, vectors),
            semanticQuery,
          )
        : []
      const results = withoutExcluded(
        withSemanticResults(manual, semantic),
        queryExclusions(query.query).rules,
      )
      const semanticSet = new Set(semantic)
      const fromSemantic = results.map((result) => semanticSet.has(result))

      const manualMs = time(MANUAL_RUNS, () => search(query.query))
      const semanticMs: number[] = []
      if (triggered) {
        for (let run = 0; run < SEMANTIC_RUNS; run++) {
          const runStart = performance.now()
          const runVector = await embed(semanticQuery)
          withSemanticResults(
            manual,
            withQueryDirection(
              semanticResults(runVector, texts, vectors),
              semanticQuery,
            ),
          )
          semanticMs.push(performance.now() - runStart)
        }
      }

      outcomes.push({
        query,
        results,
        fromSemantic,
        layer: layerOf(triggered, fromSemantic),
        bestManual: manual[0]?.score ?? 0,
        triggered,
        check: check(query.expect, results, fromSemantic),
        cosine: cosines(vector, texts, vectors, expectedKeys(query.expect)),
        manualMs,
        semanticMs,
      })
    }

    return { outcomes, modelLoadMs, firstEmbedMs, networkRequests }
  } finally {
    globalThis.fetch = realFetch
  }
}

function time(runs: number, work: () => unknown): number[] {
  const durations: number[] = []
  for (let run = 0; run < runs; run++) {
    const start = performance.now()
    work()
    durations.push(performance.now() - start)
  }
  return durations
}

function layerOf(triggered: boolean, fromSemantic: boolean[]): Layer {
  if (!fromSemantic.length) {
    return 'none'
  }
  if (!triggered) {
    return 'manual (confident)'
  }
  const semantic = fromSemantic.filter(Boolean).length
  if (!semantic) {
    return 'manual (weak)'
  }
  return semantic === fromSemantic.length ? 'semantic' : 'manual + semantic'
}

export function expectedKeys(expect: Expectation): Key[] {
  switch (expect.type) {
    case 'nothing':
      return []
    case 'first':
      return [expect.key]
    case 'ordered':
    case 'includes':
      return expect.keys
  }
}

function check(
  expect: Expectation,
  results: SearchResult[],
  fromSemantic: boolean[],
): Check {
  const keys = results.map(keyOf)
  const labelled = (index: number) =>
    `${keys[index]}${fromSemantic[index] ? ' (semantic)' : ' (manual)'}`
  const expected = expectedKeys(expect)
  const ranks = expected
    .map((key) => keys.indexOf(key))
    .filter((index) => index >= 0)
  const firstRank = ranks.length ? Math.min(...ranks) + 1 : null
  const firstRankInTab = expected
    .filter((key) => keys.includes(key))
    .map((key) => {
      const kind = key.split(':')[0] as ResultKind
      const rank = keys.filter((k) => k.startsWith(`${kind}:`)).indexOf(key) + 1
      return { rank, kind }
    })
    .reduce<Check['firstRankInTab']>(
      (best, next) => (!best || next.rank < best.rank ? next : best),
      null,
    )
  const missing = expected.filter((key) => !keys.includes(key))
  const falsePositives: string[] = []
  const notes: string[] = []

  switch (expect.type) {
    case 'nothing':
      falsePositives.push(...keys.map((_, index) => labelled(index)))
      break
    case 'first':
      if (firstRank !== null && firstRank > 1) {
        notes.push(`ranked ${firstRank}, behind ${keys[0]}`)
      }
      break
    case 'ordered': {
      const kind = expect.keys[0].split(':')[0]
      const got = keys
        .filter((key) => key.startsWith(`${kind}:`))
        .slice(0, expect.keys.length)
      if (got.join() !== expect.keys.join()) {
        notes.push(`order: ${got.join(', ')}`)
      }
      break
    }
    case 'includes': {
      const forbidden = expect.forbidden ?? []
      results.forEach((result, index) => {
        if (forbidden.includes(result.item.name)) {
          falsePositives.push(labelled(index))
        }
        for (const match of result.matched) {
          if (forbidden.includes(String(match.value))) {
            falsePositives.push(`${labelled(index)} · matched ${match.value}`)
          }
        }
      })
      const scope = expect.exhaustive
      if (scope) {
        keys.forEach((key, index) => {
          if (
            (scope === 'all' || key.startsWith(`${scope}:`)) &&
            !expected.includes(key)
          ) {
            falsePositives.push(labelled(index))
          }
        })
      }
      break
    }
  }

  return {
    passed: !missing.length && !falsePositives.length && !notes.length,
    ...order(expect, results, firstRank),
    firstRank,
    firstRankInTab,
    expectedCount: expected.length,
    missing,
    falsePositives,
    notes,
  }
}

// Same scoring as semanticResults, but kept for every item, so the report can show how far each
// one sits from the floor instead of only what passed it.
function cosines(
  query: Float32Array,
  texts: EmbeddedText[],
  vectors: Float32Array,
  expected: Key[],
): Outcome['cosine'] {
  const best = new Map<Key, Omit<ItemCosine, 'rank'>>()
  texts.forEach((text, row) => {
    let cosine = 0
    const offset = row * query.length
    for (let dimension = 0; dimension < query.length; dimension++) {
      cosine += query[dimension] * vectors[offset + dimension]
    }
    const weight = text.source === 'description' ? DESCRIPTION_WEIGHT : 1
    const score = rescale(cosine) * weight
    const key: Key = `${text.kind}:${text.name}`
    const current = best.get(key)
    if (
      !current ||
      score > current.score ||
      (score === current.score && cosine > current.cosine)
    ) {
      best.set(key, { key, cosine, score, source: text.source })
    }
  })
  const ranked = [...best.values()]
    .sort((a, b) => b.score - a.score || b.cosine - a.cosine)
    .map((item, index) => ({ ...item, rank: index + 1 }))
  const byKey = new Map(ranked.map((item) => [item.key, item]))
  return {
    top: ranked[0],
    expected: expected.flatMap((key) => byKey.get(key) ?? []),
  }
}

export const ORDER_TOP = 3

function order(
  expect: Expectation,
  results: SearchResult[],
  firstRank: number | null,
): Pick<Check, 'orderPassed' | 'orderNotes'> {
  if (!expectedKeys(expect).length) {
    return { orderPassed: null, orderNotes: [] }
  }
  const orderNotes: string[] = []
  if (firstRank === null || firstRank > ORDER_TOP) {
    orderNotes.push(
      `first expected ${firstRank === null ? 'not found' : `at ${firstRank}`}, not in the top ${ORDER_TOP}`,
    )
  }
  const kindFirst = expect.type === 'includes' ? expect.kindFirst : undefined
  if (kindFirst && results[0]?.kind !== kindFirst) {
    orderNotes.push(`${results[0]?.kind ?? 'nothing'} first, not ${kindFirst}`)
  }
  return { orderPassed: !orderNotes.length, orderNotes }
}
