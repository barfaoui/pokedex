import { useCallback, useEffect, useRef, useState } from 'react'
import type { SearchResult } from '@/search/types/result'
import {
  AI_MAX_QUERY_LENGTH,
  aiConfigured,
  aiResults,
  askAi,
} from './ask-ai-client'

export type AiState =
  | { status: 'asking'; query: string }
  | { status: 'done'; query: string; results: SearchResult[]; note?: string }
  | { status: 'failed'; query: string; message: string }

/** Ask AI is never automatic: nothing is sent until `ask` is called. */
export function useAskAi() {
  const [available, setAvailable] = useState(false)
  const [state, setState] = useState<AiState | null>(null)
  const pending = useRef<AbortController | null>(null)

  useEffect(() => {
    let live = true
    aiConfigured().then((value) => live && setAvailable(value))
    return () => {
      live = false
      pending.current?.abort()
    }
  }, [])

  const ask = useCallback((query: string) => {
    pending.current?.abort()
    if (query.length > AI_MAX_QUERY_LENGTH) {
      setState({
        status: 'failed',
        query,
        message: `Query too long for Ask AI (${AI_MAX_QUERY_LENGTH} characters at most)`,
      })
      return
    }
    const controller = new AbortController()
    pending.current = controller
    setState({ status: 'asking', query })
    askAi(query, controller.signal).then(
      (answer) =>
        setState({
          status: 'done',
          query,
          results: aiResults(answer.results),
          note: answer.note,
        }),
      (error: unknown) => {
        if (!controller.signal.aborted) {
          setState({
            status: 'failed',
            query,
            message: error instanceof Error ? error.message : 'AI unavailable',
          })
        }
      },
    )
  }, [])

  return { available, state, ask }
}
