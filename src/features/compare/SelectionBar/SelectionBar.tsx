import { PixelArt } from '@/shared/PixelArt/PixelArt'
import './SelectionBar.scss'

const CROSS = [
  '##....##',
  '###..###',
  '.######.',
  '..####..',
  '..####..',
  '.######.',
  '###..###',
  '##....##',
]

const CROSS_PIXELS = { '#': 'selection-bar__cancel-pixel' }

interface SelectionBarProps {
  /** Carries the count, e.g. "My team (3 / 6)". */
  actionLabel: string
  actionEnabled: boolean
  /** Read out when the count changes. */
  announcement: string
  onAction: () => void
  onCancel: () => void
}

export function SelectionBar({
  actionLabel,
  actionEnabled,
  announcement,
  onAction,
  onCancel,
}: SelectionBarProps) {
  return (
    <section className="selection-bar" aria-label="Selection">
      {/* A button's new label isn't announced: this says the count out loud when it changes */}
      <p className="selection-bar__count" aria-live="polite">
        {announcement}
      </p>
      <button
        className="selection-bar__action"
        type="button"
        disabled={!actionEnabled}
        onClick={onAction}
      >
        {actionLabel}
      </button>
      {/* It replaces the button that started selection mode, which had focus: focus moves here */}
      <button
        className="selection-bar__cancel"
        type="button"
        aria-label="Cancel selection"
        autoFocus
        onClick={onCancel}
      >
        <PixelArt
          className="selection-bar__cancel-icon"
          rows={CROSS}
          pixelClasses={CROSS_PIXELS}
        />
      </button>
    </section>
  )
}
