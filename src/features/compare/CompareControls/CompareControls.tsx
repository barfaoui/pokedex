import { useRef } from 'react'
import { CompareButton } from '@/features/compare/CompareButton/CompareButton'
import { SelectionBar } from '@/features/compare/SelectionBar/SelectionBar'
import type { Selection } from '@/features/compare/useSelection'
import './CompareControls.scss'

interface CompareControlsProps {
  placement: 'header' | 'floating'
  selection: Selection
  canStart: boolean
  onCompare: () => void
}

export function CompareControls({
  placement,
  selection,
  canStart,
  onCompare,
}: CompareControlsProps) {
  const controlsRef = useRef<HTMLDivElement>(null)

  function cancel() {
    selection.cancel()
    requestAnimationFrame(() =>
      controlsRef.current?.querySelector('button')?.focus(),
    )
  }

  if (placement === 'floating' && !selection.active && !canStart) {
    return null
  }

  return (
    <div
      ref={controlsRef}
      className="compare-controls"
      data-placement={placement}
    >
      {selection.active ? (
        <SelectionBar
          count={selection.selected.length}
          onCompare={onCompare}
          onCancel={cancel}
        />
      ) : (
        <CompareButton enabled={canStart} onStart={selection.start} />
      )}
    </div>
  )
}
