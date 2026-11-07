import { useCallback, useEffect, useState } from 'react'
import { toggleSelection } from '@/features/compare/selection'

export type SelectionMode = 'compare' | 'team'

export interface Selection {
  mode: SelectionMode | null
  selected: string[]
  start: (mode: SelectionMode) => void
  cancel: () => void
  toggle: (name: string) => void
}

export function useSelection(): Selection {
  const [mode, setMode] = useState<SelectionMode | null>(null)
  const [selected, setSelected] = useState<string[]>([])

  const start = useCallback((nextMode: SelectionMode) => {
    setMode(nextMode)
    setSelected([])
  }, [])
  const cancel = useCallback(() => {
    setMode(null)
    setSelected([])
  }, [])
  const toggle = useCallback(
    (name: string) => setSelected((current) => toggleSelection(current, name)),
    [],
  )

  // Escape already handled (an open window closing, the search bar clearing) leaves selection mode alone.
  useEffect(() => {
    if (!mode) {
      return
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === 'Escape' &&
        !event.defaultPrevented &&
        !document.querySelector('dialog[open]')
      ) {
        cancel()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [mode, cancel])

  return { mode, selected, start, cancel, toggle }
}
