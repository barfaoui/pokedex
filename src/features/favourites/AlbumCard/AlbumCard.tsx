import { useId } from 'react'
import type { Pokemon } from '@/data/types/model'
import { albumStats } from '@/features/favourites/album'
import { FavouriteButton } from '@/features/favourites/FavouriteButton/FavouriteButton'
import { PokemonImage } from '@/features/pokemon/PokemonImage/PokemonImage'
import './AlbumCard.scss'

interface AlbumCardProps {
  pokemon: Pokemon
  onRemove: () => void
}

export function AlbumCard({ pokemon, onRemove }: AlbumCardProps) {
  const nameId = useId()

  return (
    <article className="album-card" aria-labelledby={nameId}>
      <div className="album-card__picture">
        <PokemonImage
          src={pokemon.artwork}
          name={pokemon.displayName}
          decorative
        />
      </div>
      <h3 className="album-card__name" id={nameId}>
        {pokemon.displayName}
      </h3>
      <p className="album-card__stats">
        {albumStats(pokemon)
          .map((stat) => `${stat.label} ${stat.value}`)
          .join(' · ')}
      </p>
      <div className="album-card__remove">
        <FavouriteButton
          pokemonName={pokemon.displayName}
          isFavourite
          onToggle={onRemove}
        />
      </div>
    </article>
  )
}
