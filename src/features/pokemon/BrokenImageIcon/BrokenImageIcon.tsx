import { PixelArt } from '@/shared/PixelArt/PixelArt'
import './BrokenImageIcon.scss'

// A picture torn in two: the right half drops by two pixels.
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
