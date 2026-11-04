// Embeds every searchable text once, at dev time, with the model in public/models/.
// Run with `npm run embeddings` after the dataset or the model changes; the app only reads the output.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { env, pipeline } from '@huggingface/transformers'
import {
  EMBED_OPTIONS,
  EMBEDDING_SIZE,
  MODEL_DTYPE,
  MODEL_ID,
  type EmbeddedText,
} from '../src/search/semantic/model.ts'

interface Effects {
  name: string
  short_effect: string
  effect: string
}

interface RawDataset {
  pokemon: { name: string; species: { description: string } }[]
  moves: Effects[]
  abilities: Effects[]
}

const DATASET = new URL('../src/data/pokedex.json', import.meta.url)
const OUTPUT = new URL('../public/semantic/', import.meta.url)

env.allowRemoteModels = false
env.localModelPath = fileURLToPath(
  new URL('../public/models/', import.meta.url),
)

// Same cleaning as the index (src/data/build-index.ts), so the vectors match what the cards show
function cleanDescription(description: string): string {
  return description.replace(/­\s*/g, '').replaceAll('POKéMON', 'Pokémon')
}

const dataset = JSON.parse(readFileSync(DATASET, 'utf8')) as RawDataset
const rows: { text: EmbeddedText; content: string }[] = []
for (const [kind, items] of [
  ['move', dataset.moves],
  ['ability', dataset.abilities],
] as const) {
  for (const item of items) {
    rows.push({
      text: { kind, name: item.name, source: 'short' },
      content: item.short_effect,
    })
    rows.push({
      text: { kind, name: item.name, source: 'full' },
      content: item.effect,
    })
  }
}
for (const pokemon of dataset.pokemon) {
  rows.push({
    text: { kind: 'pokemon', name: pokemon.name, source: 'description' },
    content: cleanDescription(pokemon.species.description),
  })
}

const embed = await pipeline('feature-extraction', MODEL_ID, {
  dtype: MODEL_DTYPE,
})
const vectors = new Float32Array(rows.length * EMBEDDING_SIZE)
for (const [index, row] of rows.entries()) {
  const output = await embed(row.content, EMBED_OPTIONS)
  vectors.set(output.data as Float32Array, index * EMBEDDING_SIZE)
}

mkdirSync(OUTPUT, { recursive: true })
writeFileSync(new URL('embeddings.bin', OUTPUT), Buffer.from(vectors.buffer))
writeFileSync(
  new URL('texts.json', OUTPUT),
  JSON.stringify(rows.map((row) => row.text)),
)
console.log(`${rows.length} texts embedded`)
