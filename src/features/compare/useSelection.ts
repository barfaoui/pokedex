import { useCallback, useEffect, useState } from 'react'
import { toggleSelection } from '@/features/compare/selection'

export interface Selection {
  active: boolean
  selected: string[]
  start: () => void
  cancel: () => void
  toggle: (name: string) => void
}

export function useSelection(): Selection {
  const [active, setActive] = useState(false)
  const [selected, setSelected] = useState<string[]>([])

  const start = useCallback(() => setActive(true), [])
  const cancel = useCallback(() => {
    setActive(false)
    setSelected([])
  }, [])
  const toggle = useCallback(
    (name: string) => setSelected((current) => toggleSelection(current, name)),
    [],
  )

  // Escape already handled (an open window closing, the search bar clearing) leaves selection mode alone.
  useEffect(() => {
    if (!active) {
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
  }, [active, cancel])

  return { active, selected, start, cancel, toggle }
}
