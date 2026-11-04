import { PixelArt } from '../PixelArt/PixelArt'
import './FavouriteButton.scss'

const HEART_FULL = [
  '.##...##.',
  '####.####',
  '#########',
  '#########',
  '.#######.',
  '..#####..',
  '...###...',
  '....#....',
]

const HEART_EMPTY = [
  '.##...##.',
  '#..#.#..#',
  '#...#...#',
  '#.......#',
  '.#.....#.',
  '..#...#..',
  '...#.#...',
  '....#....',
]

const HEART_PIXELS = { '#': 'favourite-button__pixel' }

interface FavouriteButtonProps {
  pokemonName: string
  isFavourite: boolean
  onToggle: () => void
}

export function FavouriteButton({
  pokemonName: pokemonName,
  isFavourite,
  onToggle,
}: FavouriteButtonProps) {
  return (
    <button
      className="favourite-button"
      type="button"
      aria-pressed={isFavourite}
      aria-label={
        isFavourite
          ? `Remove ${pokemonName} from the Pokédex`
          : `Add ${pokemonName} to the Pokédex`
      }
      onClick={onToggle}
    >
      <PixelArt
        className="favourite-button__heart"
        rows={isFavourite ? HEART_FULL : HEART_EMPTY}
        pixelClasses={HEART_PIXELS}
      />
    </button>
  )
}
