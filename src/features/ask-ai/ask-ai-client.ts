// The browser side of Ask AI: it only ever talks to /api/ask-ai, never to the AI provider, and
// holds no key. The types come from the server module; nothing else of it reaches the bundle.
import type { AiAnswer } from '../../../api/_lib/ask-ai'
import { index } from '@/data/dataset'
import type { SearchResult } from '@/search/types/result'

export type { AiAnswer } from '../../../api/_lib/ask-ai'

const AI_UNAVAILABLE = 'AI unavailable'
export const AI_NOTICE =
  'Ask AI: sends your query to an AI provider (Anthropic)'
// The server's own limit: checked here too, to say so before sending.
export const AI_MAX_QUERY_LENGTH = 200

export interface AiStatus {
  configured: boolean
  /** The server's model id, e.g. claude-haiku-5-5; null when the server doesn't say. */
  model: string | null
  thinking: 'disabled' | 'default'
}

let status: Promise<AiStatus> | undefined

/** Whether the server has a key, and its model. Asked once per visit; any failure counts as no. */
export function aiStatus(): Promise<AiStatus> {
  status ??= fetch('/api/ask-ai-status')
    .then((response) => (response.ok ? response.json() : null))
    .then((body: unknown) => {
      const { configured, model, thinking } = (body ?? {}) as Record<
        string,
        unknown
      >
      return {
        configured: configured === true,
        model: typeof model === 'string' ? model : null,
        thinking: thinking === 'disabled' ? 'disabled' : 'default',
      } satisfies AiStatus
    })
    .catch(() => ({ configured: false, model: null, thinking: 'default' }))
  return status
}

export function aiConfigured(): Promise<boolean> {
  return aiStatus().then((value) => value.configured)
}

/** Rejects with a short message fit for the page, never an upstream detail. */
export async function askAi(
  query: string,
  signal?: AbortSignal,
): Promise<AiAnswer> {
  let response: Response
  try {
    response = await fetch('/api/ask-ai', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query }),
      signal,
    })
  } catch (error) {
    throw error instanceof DOMException && error.name === 'AbortError'
      ? error
      : new Error(AI_UNAVAILABLE)
  }
  const body: unknown = await response.json().catch(() => null)
  if (!response.ok || !body || typeof body !== 'object') {
    const message = (body as { error?: unknown } | null)?.error
    throw new Error(typeof message === 'string' ? message : AI_UNAVAILABLE)
  }
  return body as AiAnswer
}

/**
 * The answer as result cards, best first. A key the data doesn't hold is dropped again here, and
 * the score stays below 1: an AI answer is never an exact match.
 */
export function aiResults(keys: string[]): SearchResult[] {
  return keys.flatMap((key): SearchResult[] => {
    if (typeof key !== 'string') {
      return []
    }
    const [kind, name] = key.split(':')
    switch (kind) {
      case 'pokemon': {
        const item = index.pokemon.get(name)
        return item ? [{ kind, item, score: 0, matched: [] }] : []
      }
      case 'move': {
        const item = index.moves.get(name)
        return item ? [{ kind, item, score: 0, matched: [] }] : []
      }
      case 'ability': {
        const item = index.abilities.get(name)
        return item ? [{ kind, item, score: 0, matched: [] }] : []
      }
      default:
        return []
    }
  })
}
