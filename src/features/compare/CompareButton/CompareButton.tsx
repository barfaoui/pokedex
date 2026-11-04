import { useId } from 'react'
import './CompareButton.scss'

interface CompareButtonProps {
  enabled: boolean
  onStart: () => void
}

export function CompareButton({ enabled, onStart }: CompareButtonProps) {
  const hintId = useId()

  return (
    <>
      <button
        className="compare-button"
        type="button"
        aria-disabled={!enabled}
        aria-describedby={enabled ? undefined : hintId}
        onClick={enabled ? onStart : undefined}
      >
        Compare 2
      </button>
      {!enabled && (
        <span className="compare-button__hint" id={hintId}>
          Open the Pokémon tab to compare
        </span>
      )}
    </>
  )
}
