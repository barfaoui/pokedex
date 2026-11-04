// The real model, on the committed model files and embeddings. Slower than the unit tests
// (loads a 33 MB model), so it runs on its own: npm run test:semantic
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { beforeAll, describe, expect, test } from 'vitest'
import { env, pipeline } from '@huggingface/transformers'
import { needsSemantic, search } from '@/search/search'
import {
  EMBED_OPTIONS,
  MODEL_DTYPE,
  MODEL_ID,
  type EmbeddedText,
} from '@/search/semantic/model'
import { semanticResults, withQueryDirection } from '@/search/semantic/semantic'

env.allowRemoteModels = false
env.localModelPath = fileURLToPath(
  new URL('../public/models/', import.meta.url),
)

const texts = JSON.parse(
  readFileSync(
    new URL('../public/semantic/texts.json', import.meta.url),
    'utf8',
  ),
) as EmbeddedText[]
const bytes = readFileSync(
  new URL('../public/semantic/embeddings.bin', import.meta.url),
)
const vectors = new Float32Array(
  bytes.buffer,
  bytes.byteOffset,
  bytes.byteLength / Float32Array.BYTES_PER_ELEMENT,
)

let embed: (query: string) => Promise<Float32Array>
let loadSeconds = 0

beforeAll(async () => {
  const start = performance.now()
  const extractor = await pipeline('feature-extraction', MODEL_ID, {
    dtype: MODEL_DTYPE,
  })
  loadSeconds = (performance.now() - start) / 1000
  embed = async (query) =>
    (await extractor(query, EMBED_OPTIONS)).data as Float32Array
})

async function searchByMeaning(query: string) {
  return withQueryDirection(
    semanticResults(await embed(query), texts, vectors),
    query,
  )
}

describe('semantic search with the real model', () => {
  test('loads in Node (time reported)', () => {
    console.info(`model load in Node: ${loadSeconds.toFixed(2)} s`)
    expect(loadSeconds).toBeGreaterThan(0)
  })

  test('"make the enemy doze off" finds the sleep moves first', async () => {
    const query = 'make the enemy doze off'
    expect(needsSemantic(search(query))).toBe(true)

    const top = (await searchByMeaning(query))
      .slice(0, 5)
      .map((result) => result.item.name)
    expect(top.sort()).toEqual(
      ['hypnosis', 'lovely-kiss', 'sing', 'sleep-powder', 'spore'].sort(),
    )
  })

  test('"spaghetti" still finds nothing', async () => {
    expect(needsSemantic(search('spaghetti'))).toBe(true)
    expect(await searchByMeaning('spaghetti')).toEqual([])
  })

  test.each(['hello world', 'banana bread recipe'])(
    '"%s" finds nothing',
    async (query) => {
      expect(await searchByMeaning(query)).toEqual([])
    },
  )

  test('"make it fall asleep" drops what puts itself to sleep or prevents it', async () => {
    const names = (await searchByMeaning('make it fall asleep')).map(
      (result) => result.item.name,
    )
    expect(names).toContain('sleep-powder')
    for (const name of ['rest', 'insomnia', 'vital-spirit']) {
      expect(names).not.toContain(name)
    }
  })

  test('"put my opponent to sleep" never reaches semantic search', () => {
    expect(needsSemantic(search('put my opponent to sleep'))).toBe(false)
  })
})
