import { useId } from 'react'
import type { SelectionMode } from '@/features/compare/useSelection'
import './ModeButton.scss'

interface ModeButtonProps {
  /** The mode this button belongs to, so focus can come back to it when that mode ends. */
  mode: SelectionMode
  label: string
  hint: string
  enabled: boolean
  onClick: () => void
}

// Greyed out rather than disabled, so it stays focusable and can say why.
export function ModeButton({
  mode,
  label,
  hint,
  enabled,
  onClick,
}: ModeButtonProps) {
  const hintId = useId()

  return (
    <>
      <button
        className="mode-button"
        type="button"
        data-mode={mode}
        aria-disabled={!enabled}
        aria-describedby={enabled ? undefined : hintId}
        onClick={enabled ? onClick : undefined}
      >
        {label}
      </button>
      {!enabled && (
        <span className="mode-button__hint" id={hintId}>
          {hint}
        </span>
      )}
    </>
  )
}
