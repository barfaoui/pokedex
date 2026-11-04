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
  count: number
  onCompare: () => void
  onCancel: () => void
}

export function SelectionBar({
  count,
  onCompare,
  onCancel,
}: SelectionBarProps) {
  return (
    <section className="selection-bar" aria-label="Selection">
      {/* A button's new label isn't announced: this says the count out loud when it changes */}
      <p className="selection-bar__count" aria-live="polite">
        {count} selected
      </p>
      <button
        className="selection-bar__compare"
        type="button"
        disabled={count !== 2}
        onClick={onCompare}
      >
        Compare 2 ({count})
      </button>
      {/* It replaces Compare 2, which had focus: focus moves here instead of being lost */}
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
