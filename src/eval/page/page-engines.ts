import type { AiAnswer } from '../../../api/_lib/ask-ai'
import { configByKey, DEFAULT_CONFIG } from '../../../api/_lib/models'
import { USD_TO_EUR } from '../../../api/_lib/pricing'
import csv from '../../../tests/eval/cases.csv?raw'
import { parseCases } from '@/eval/cases'
import type { SemanticSearch } from '@/eval/engines/engine'
import {
  availableEngines,
  ENGINE_DEFINITIONS,
  type AvailableEngine,
} from '@/eval/engines/engines'
import fallbackDefinition, {
  FALLBACK_NAME,
  NEEDS_LLM_RUN,
} from '@/eval/engines/llm-fallback.engine'
import llmDefinition from '@/eval/engines/llm.engine'
import { NO_RUN_YET } from '@/eval/llm-snapshot'
import { askAi } from '@/features/ask-ai/ask-ai-client'
import {
  modelStatus,
  onModelStatus,
  semanticClient,
} from '@/features/semantic/semantic-client'

export const CASES = parseCases(csv)
export const LLM_ID = llmDefinition.id
export const FALLBACK_ID = fallbackDefinition.id

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

const LLM_IDS = [LLM_ID, FALLBACK_ID]

/** Every engine but the two that use the LLM, which depend on the model and live toggle. */
export const LOCAL_ENGINES = availableEngines(context).filter(
  (engine) => !LLM_IDS.includes(engine.id),
)

/** Engines that can't run here (a missing key), shown disabled. */
export const UNAVAILABLE = ENGINE_DEFINITIONS.filter(
  (definition) =>
    !LLM_IDS.includes(definition.id) &&
    !LOCAL_ENGINES.some((engine) => engine.id === definition.id),
).map((definition) => definition.id)

export const ENGINE_ORDER = ENGINE_DEFINITIONS.map(
  (definition) => definition.id,
)

export interface LiveTransport {
  askAi: (query: string) => Promise<AiAnswer>
  spentEur: () => number
}

/**
 * One per live Run, through /api/ask-ai (the browser never holds a key). Shared by the LLM and the
 * fallback, so a query both need is asked once and billed once.
 */
export function liveTransport(): LiveTransport {
  const answers = new Map<string, Promise<AiAnswer>>()
  let spentEur = 0
  return {
    askAi: (query) => {
      let answer = answers.get(query)
      if (!answer) {
        answer = askAi(query).then((value) => {
          spentEur += value.usage.costUsd * USD_TO_EUR
          return value
        })
        answers.set(query, answer)
        answer.catch(() => answers.delete(query))
      }
      return answer
    },
    spentEur: () => spentEur,
  }
}

/**
 * The LLM and the fallback for this model: live with a transport, else on its latest recorded run,
 * else placeholders whose columns say there is none.
 */
export function llmEngines(
  model: string,
  transport: LiveTransport | null,
): { llm: AvailableEngine; fallback: AvailableEngine } {
  const llmContext = {
    ...context,
    llm: { model, ...(transport ? { askAi: transport.askAi } : {}) },
  }
  return {
    llm: {
      ...(llmDefinition.create(llmContext) ?? {
        name: `LLM (${(configByKey(model) ?? DEFAULT_CONFIG).label})`,
        placeholder: NO_RUN_YET,
        search: async () => [],
      }),
      id: LLM_ID,
    },
    fallback: {
      ...(fallbackDefinition.create(llmContext) ?? {
        name: FALLBACK_NAME,
        placeholder: NEEDS_LLM_RUN,
        search: async () => [],
      }),
      id: FALLBACK_ID,
    },
  }
}

/** null until an engine has needed the model. */
export function modelLoadMs(): Promise<number> | null {
  return semantic?.ready() ?? null
}
