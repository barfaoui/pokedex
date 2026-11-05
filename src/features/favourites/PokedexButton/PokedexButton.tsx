import { PixelArt } from '@/shared/PixelArt/PixelArt'
import './PokedexButton.scss'

const ALBUM = [
  '.##########.',
  '#AAAAAAAAA##',
  '#AAAAAAAAA#W',
  '#AARRARRAA#W',
  '#ARRRRRRRA#W',
  '#ARRRRRRRA#W',
  '#AARRRRRAA#W',
  '#AAARRRAAA#W',
  '#AAAARAAAA#W',
  '#AAAAAAAAA#W',
  '#AAAAAAAAA##',
  '.##########.',
]

const ALBUM_PIXELS = {
  '#': 'pokedex-button__outline',
  A: 'pokedex-button__cover',
  R: 'pokedex-button__heart',
  W: 'pokedex-button__pages',
}

interface PokedexButtonProps {
  count: number
  onOpen: () => void
}

export function PokedexButton({ count, onOpen }: PokedexButtonProps) {
  return (
    <button
      className="pokedex-button"
      type="button"
      aria-label={`Pokédex, ${count} ${count === 1 ? 'Pokémon' : 'Pokémons'}`}
      onClick={onOpen}
    >
      <PixelArt
        className="pokedex-button__icon"
        rows={ALBUM}
        pixelClasses={ALBUM_PIXELS}
      />
      <span className="pokedex-button__count" aria-hidden="true">
        {count}
      </span>
    </button>
  )
}
