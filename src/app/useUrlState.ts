import { useCallback, useState } from 'react'
import { readUrlState, writeUrlState, type UrlState } from './url-state'

/** In the URL so a search can be shared and survives a refresh. */
export function useUrlState(): [UrlState, (next: UrlState) => void] {
  const [state, setState] = useState(() => readUrlState(window.location.search))

  // Replaces the history entry: one entry per keystroke would make Back useless.
  const update = useCallback((next: UrlState) => {
    setState(next)
    window.history.replaceState(
      null,
      '',
      writeUrlState(next) || window.location.pathname,
    )
  }, [])

  return [state, update]
}
