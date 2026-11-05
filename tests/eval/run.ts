import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { env, pipeline } from '@huggingface/transformers'
import { index } from '@/data/dataset'
import { parseCases, type EvalCase } from '@/eval/cases'
import type { SemanticSearch } from '@/eval/engines/engine'
import {
  EMBED_OPTIONS,
  MODEL_DTYPE,
  MODEL_ID,
  type EmbeddedText,
} from '@/search/semantic/model'
import { semanticResults, withQueryDirection } from '@/search/semantic/semantic'

const root = new URL('../../', import.meta.url)

export function loadCases(): EvalCase[] {
  return parseCases(readFileSync(new URL('tests/eval/cases.csv', root), 'utf8'))
}

/** A typo in cases.csv would otherwise show up as a miss of the search. */
export function unknownItems(cases: EvalCase[]): string[] {
  const names = {
    pokemon: index.pokemon,
    move: index.moves,
    ability: index.abilities,
  }
  const known = (item: string) => {
    const [kind, name] = item.includes(':') ? item.split(':') : ['', item]
    return kind
      ? (names[kind as keyof typeof names]?.has(name) ?? false)
      : Object.values(names).some((items) => items.has(name))
  }
  return [
    ...new Set(
      cases.flatMap((c) =>
        [...c.best, ...c.ok, ...c.forbidden]
          .filter((item) => !known(item))
          .map((item) => `${item} (case ${c.id})`),
      ),
    ),
  ]
}

/** The worker's job in Node: same model files, same scoring as semantic-client.ts. */
export function nodeSemantic(): SemanticSearch {
  env.allowRemoteModels = false
  env.localModelPath = fileURLToPath(new URL('public/models/', root))
  const texts = JSON.parse(
    readFileSync(new URL('public/semantic/texts.json', root), 'utf8'),
  ) as EmbeddedText[]
  const bytes = readFileSync(new URL('public/semantic/embeddings.bin', root))
  const vectors = new Float32Array(
    bytes.buffer,
    bytes.byteOffset,
    bytes.byteLength / Float32Array.BYTES_PER_ELEMENT,
  )

  const start = performance.now()
  const extractor = pipeline('feature-extraction', MODEL_ID, {
    dtype: MODEL_DTYPE,
  })
  const loaded = extractor.then(() => performance.now() - start)

  return {
    ready: () => loaded,
    search: async (query) => {
      const embed = await extractor
      const vector = (await embed(query, EMBED_OPTIONS)).data as Float32Array
      return withQueryDirection(semanticResults(vector, texts, vectors), query)
    },
  }
}
