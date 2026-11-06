import { useEffect, useState, useSyncExternalStore } from 'react'
import {
  modelStatus,
  onModelStatus,
  semanticClient,
} from '@/features/semantic/semantic-client'
import type { SearchResult } from '@/search/types/result'

// Searching by meaning waits until typing pauses; deterministic search answers on every keystroke.
const DEBOUNCE_MS = 200

export type SemanticStatus =
  'off' | 'loading-model' | 'searching' | 'done' | 'failed'

interface Answer {
  query: string
  results: SearchResult[]
}

export function useSemanticSearch(
  query: string,
  enabled: boolean,
): { status: SemanticStatus; results: SearchResult[] } {
  const [answer, setAnswer] = useState<Answer | null>(null)
  const model = useSyncExternalStore(onModelStatus, modelStatus)

  useEffect(() => {
    if (!enabled) {
      return
    }
    const timer = setTimeout(() => {
      semanticClient()
        .search(query)
        .then((results) => setAnswer({ query, results }))
        // A failed model already shows as the 'failed' status
        .catch(() => {})
    }, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [query, enabled])

  if (!enabled) {
    return { status: 'off', results: [] }
  }
  if (model === 'failed') {
    return { status: 'failed', results: [] }
  }
  if (answer?.query === query) {
    return { status: 'done', results: answer.results }
  }
  return {
    status: model === 'ready' ? 'searching' : 'loading-model',
    results: [],
  }
}
