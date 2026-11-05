import csv from '../../../tests/eval/cases.csv?raw'
import { parseCases } from '@/eval/cases'
import type { SemanticSearch } from '@/eval/engines/engine'
import {
  availableEngines,
  ENGINE_DEFINITIONS,
} from '@/eval/engines/engines'
import {
  modelStatus,
  onModelStatus,
  semanticClient,
} from '@/features/semantic/semantic-client'

export const CASES = parseCases(csv)

let semantic: SemanticSearch | undefined

/** The app's own worker and client: one model for the whole visit, as in the app. */
function browserSemantic(): SemanticSearch {
  const start = performance.now()
  const client = semanticClient()
  const loaded = new Promise<number>((resolve, reject) => {
    const settle = () => {
      const status = modelStatus()
      if (status === 'ready') {
        resolve(performance.now() - start)
      } else if (status === 'failed') {
        reject(new Error('The model failed to load'))
      }
    }
    onModelStatus(settle)
    settle()
  })
  return { search: client.search, ready: () => loaded }
}

const env = Object.fromEntries(
  Object.entries(import.meta.env).map(([name, value]) => [
    name,
    typeof value === 'string' ? value : undefined,
  ]),
)

export const ENGINES = availableEngines({
  semantic: () => (semantic ??= browserSemantic()),
  env,
})

export const UNAVAILABLE = ENGINE_DEFINITIONS.filter(
  (definition) => !ENGINES.some((engine) => engine.id === definition.id),
).map((definition) => definition.id)

/** null until an engine has needed the model. */
export function modelLoadMs(): Promise<number> | null {
  return semantic?.ready() ?? null
}
