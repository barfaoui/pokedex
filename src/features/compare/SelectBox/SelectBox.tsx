import { PixelArt } from '@/shared/PixelArt/PixelArt'
import './SelectBox.scss'

const TICK = [
  '.......#',
  '......##',
  '.....##.',
  '#...##..',
  '##.##...',
  '.###....',
  '..#.....',
  '........',
]

const TICK_PIXELS = { '#': 'select-box__tick-pixel' }

interface SelectBoxProps {
  selected: boolean
}

// What the card's select control looks like; the control itself is the card's own button.
export function SelectBox({ selected }: SelectBoxProps) {
  return (
    <span className="select-box" data-selected={selected} aria-hidden="true">
      {selected && (
        <PixelArt
          className="select-box__tick"
          rows={TICK}
          pixelClasses={TICK_PIXELS}
        />
      )}
    </span>
  )
}
