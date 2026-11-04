import { useId } from 'react'
import type { Pokemon } from '../../data/types/model'
import type { Scored } from '../../search/types/result'
import { FavouriteButton } from '../FavouriteButton/FavouriteButton'
import { MatchList } from '../MatchList/MatchList'
import { PokemonImage } from '../PokemonImage/PokemonImage'
import { ResultCard } from '../ResultCard/ResultCard'
import { TypeBadge } from '../TypeBadge/TypeBadge'
import './PokemonCard.scss'

interface PokemonCardProps {
  result: { item: Pokemon } & Scored
  isFavourite: boolean
  onToggleFavourite: (name: string) => void
}

export function PokemonCard({
  result,
  isFavourite,
  onToggleFavourite,
}: PokemonCardProps) {
  const nameId = useId()
  const pokemon = result.item
  const matchedTypes = new Set(
    result.matched
      .filter((match) => match.field === 'type')
      .map((match) => match.value),
  )

  return (
    <ResultCard nameId={nameId} score={result.score}>
      <PokemonImage src={pokemon.artwork} name={pokemon.displayName} />
      <h3 className="pokemon-card__name" id={nameId}>
        {pokemon.displayName}
      </h3>
      <div className="pokemon-card__favourite">
        <FavouriteButton
          pokemonName={pokemon.displayName}
          isFavourite={isFavourite}
          onToggle={() => onToggleFavourite(pokemon.name)}
        />
      </div>
      <p className="pokemon-card__types">
        {pokemon.types.map((type) => (
          <TypeBadge
            key={type}
            type={type}
            matchedOn={matchedTypes.has(type)}
          />
        ))}
      </p>
      <MatchList matches={result.matched} />
    </ResultCard>
  )
}
