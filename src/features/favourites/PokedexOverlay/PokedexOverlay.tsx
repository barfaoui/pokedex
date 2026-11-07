import { index } from '@/data/dataset'
import { pocketCount } from '@/features/favourites/album'
import { AlbumCard } from '@/features/favourites/AlbumCard/AlbumCard'
import { Overlay } from '@/shared/Overlay/Overlay'
import './PokedexOverlay.scss'

interface PokedexOverlayProps {
  favourites: string[]
  onRemove: (name: string) => void
  onClose: () => void
}

export function PokedexOverlay({
  favourites,
  onRemove,
  onClose,
}: PokedexOverlayProps) {
  const pokemon = favourites.flatMap((name) => index.pokemon.get(name) ?? [])
  const emptyPockets = pocketCount(pokemon.length) - pokemon.length

  return (
    <Overlay title="My Pokédex" contentKey="pokedex" onClose={onClose}>
      <section className="pokedex-overlay">
        {!pokemon.length && (
          <p className="pokedex-overlay__hint">
            Tap the ♡ on a Pokémon to add it here.
          </p>
        )}
        <ul className="pokedex-overlay__pockets" aria-label="Favourites">
          {pokemon.map((favourite) => (
            <li className="pokedex-overlay__pocket" key={favourite.name}>
              <AlbumCard
                pokemon={favourite}
                onRemove={() => onRemove(favourite.name)}
              />
            </li>
          ))}
          {Array.from({ length: emptyPockets }, (_, pocket) => (
            // Empty pockets have nothing to tell apart but their place
            <li className="pokedex-overlay__empty" key={`empty-${pocket}`}>
              Empty pocket
            </li>
          ))}
        </ul>
      </section>
    </Overlay>
  )
}
