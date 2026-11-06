import csv from '../../../tests/eval/cases.csv?raw'
import { parseCases } from '@/eval/cases'
import type { SemanticSearch } from '@/eval/engines/engine'
import {
  availableEngines,
  ENGINE_DEFINITIONS,
  type AvailableEngine,
} from '@/eval/engines/engines'
import llmDefinition from '@/eval/engines/llm.engine'
import { modelLabel } from '@/eval/format'
import { NO_RUN_YET } from '@/eval/llm-snapshot'
import { askAi } from '@/features/ask-ai/ask-ai-client'
import {
  modelStatus,
  onModelStatus,
  semanticClient,
} from '@/features/semantic/semantic-client'

export const CASES = parseCases(csv)
export const LLM_ID = llmDefinition.id

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

const context = {
  semantic: () => (semantic ??= browserSemantic()),
  env,
}

/** Every engine but the LLM, which depends on the model and live toggle picked on the page. */
export const LOCAL_ENGINES = availableEngines(context).filter(
  (engine) => engine.id !== LLM_ID,
)

/** Engines that can't run here (a missing key), shown disabled. */
export const UNAVAILABLE = ENGINE_DEFINITIONS.filter(
  (definition) =>
    definition.id !== LLM_ID &&
    !LOCAL_ENGINES.some((engine) => engine.id === definition.id),
).map((definition) => definition.id)

export const ENGINE_ORDER = ENGINE_DEFINITIONS.map(
  (definition) => definition.id,
)

/**
 * Live: a new engine through /api/ask-ai (the browser never holds a key), so its spending starts
 * at 0. Otherwise the model's recorded run, or a placeholder whose column says there is none.
 */
export function llmEngine(model: string, live: boolean): AvailableEngine {
  const engine = llmDefinition.create({
    ...context,
    llm: { model, ...(live ? { askAi: (query) => askAi(query) } : {}) },
  })
  return {
    ...(engine ?? {
      name: `LLM: ${modelLabel(model)}`,
      shortName: 'LLM',
      placeholder: NO_RUN_YET,
      search: async () => [],
    }),
    id: LLM_ID,
  }
}

/** null until an engine has needed the model. */
export function modelLoadMs(): Promise<number> | null {
  return semantic?.ready() ?? null
}
