// The browser side of Ask AI: it only ever talks to /api/ask-ai, never to the AI provider, and
// holds no key. The types come from the server module; nothing else of it reaches the bundle.
import type { AiAnswer, AiEntry } from '../../../api/_lib/ask-ai'
import { index } from '@/data/dataset'
import type { SearchResult } from '@/search/types/result'

export type { AiAnswer } from '../../../api/_lib/ask-ai'

const AI_UNAVAILABLE = 'AI unavailable'
// The server's own limit: checked here too, to say so before sending.
export const AI_MAX_QUERY_LENGTH = 200

let configured: Promise<boolean> | undefined

/** Whether the server has a key. Asked once per visit; any failure counts as no. */
export function aiConfigured(): Promise<boolean> {
  configured ??= fetch('/api/ask-ai-status')
    .then((response) => (response.ok ? response.json() : null))
    .then(
      (body: unknown) =>
        (body as { configured?: unknown })?.configured === true,
    )
    .catch(() => false)
  return configured
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
export function aiResults(entries: AiEntry[]): SearchResult[] {
  return entries.flatMap((entry): SearchResult[] => {
    if (typeof entry?.key !== 'string') {
      return []
    }
    const [kind, name] = entry.key.split(':')
    const matched: SearchResult['matched'] =
      typeof entry.note === 'string' && entry.note
        ? [{ field: 'ai', value: entry.note }]
        : []
    switch (kind) {
      case 'pokemon': {
        const item = index.pokemon.get(name)
        return item ? [{ kind, item, score: 0, matched }] : []
      }
      case 'move': {
        const item = index.moves.get(name)
        return item ? [{ kind, item, score: 0, matched }] : []
      }
      case 'ability': {
        const item = index.abilities.get(name)
        return item ? [{ kind, item, score: 0, matched }] : []
      }
      default:
        return []
    }
  })
}
