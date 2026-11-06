import csv from '../../../tests/eval/cases.csv?raw'
import { parseCases } from '@/eval/cases'
import type { SemanticSearch } from '@/eval/engines/engine'
import {
  availableEngines,
  ENGINE_DEFINITIONS,
  type AvailableEngine,
} from '@/eval/engines/engines'
import llmDefinition from '@/eval/engines/llm.engine'
import { askAi } from '@/features/ask-ai/ask-ai-client'
import {
  modelStatus,
  onModelStatus,
  semanticClient,
} from '@/features/semantic/semantic-client'

export const CASES = parseCases(csv)

let semantic: SemanticSearch | undefined

/** The app's own worker and client, so the model loads once, as in the app. */
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

// The live LLM is billed, so it never joins the default run: it has its own button.
export const UNAVAILABLE = ENGINE_DEFINITIONS.filter(
  (definition) =>
    definition.id !== llmDefinition.id &&
    !ENGINES.some((engine) => engine.id === definition.id),
).map((definition) => definition.id)

let liveLlm: AvailableEngine | undefined

/** The live LLM engine, through /api/ask-ai: the browser never holds a key. */
export function liveLlmEngine(): AvailableEngine {
  liveLlm ??= {
    ...llmDefinition.create({
      semantic: () => (semantic ??= browserSemantic()),
      env,
      askAi: (query) => askAi(query),
    })!,
    id: llmDefinition.id,
  }
  return liveLlm
}

/** null until an engine has needed the model. */
export function modelLoadMs(): Promise<number> | null {
  return semantic?.ready() ?? null
}
