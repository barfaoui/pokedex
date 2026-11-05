import { PixelArt } from '@/shared/PixelArt/PixelArt'
import './BrokenImageIcon.scss'

const BROKEN_IMAGE = [
  '................',
  '.#######........',
  '.#..............',
  '.#.##....######.',
  '.#.##.........#.',
  '.#............#.',
  '.#............#.',
  '.#............#.',
  '.#.#..........#.',
  '.#.##.........#.',
  '.#####......#.#.',
  '.######....##.#.',
  '.######...#####.',
  '.........######.',
  '........#######.',
  '................',
]

const BROKEN_IMAGE_PIXELS = { '#': 'broken-image-icon__pixel' }

export function BrokenImageIcon() {
  return (
    <PixelArt
      className="broken-image-icon"
      rows={BROKEN_IMAGE}
      pixelClasses={BROKEN_IMAGE_PIXELS}
    />
  )
}
