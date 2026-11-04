import { useId } from 'react'
import type { Pokemon } from '@/data/types/model'
import type { Scored } from '@/search/types/result'
import { FavouriteButton } from '@/features/favourites/FavouriteButton/FavouriteButton'
import { MatchList } from '@/features/results/MatchList/MatchList'
import { PokemonImage } from '@/features/pokemon/PokemonImage/PokemonImage'
import { SelectBox } from '@/features/compare/SelectBox/SelectBox'
import {
  ResultCard,
  type CardSelection,
} from '@/features/results/ResultCard/ResultCard'
import { TypeBadge } from '@/features/pokemon/TypeBadge/TypeBadge'
import './PokemonCard.scss'

interface PokemonCardProps {
  result: { item: Pokemon } & Scored
  isFavourite: boolean
  onToggleFavourite: (name: string) => void
  onOpen: () => void
  selection?: CardSelection
}

export function PokemonCard({
  result,
  isFavourite,
  onToggleFavourite,
  onOpen,
  selection,
}: PokemonCardProps) {
  const nameId = useId()
  const pokemon = result.item
  const matchedTypes = new Set(
    result.matched
      .filter((match) => match.field === 'type')
      .map((match) => match.value),
  )

  return (
    <ResultCard
      nameId={nameId}
      name={pokemon.displayName}
      score={result.score}
      onOpen={onOpen}
      selection={selection}
    >
      <PokemonImage src={pokemon.artwork} name={pokemon.displayName} />
      <h3 className="pokemon-card__name" id={nameId}>
        {pokemon.displayName}
      </h3>
      {selection ? (
        <div className="pokemon-card__tick">
          <SelectBox selected={selection.selected} />
        </div>
      ) : (
        <div className="pokemon-card__favourite">
          <FavouriteButton
            pokemonName={pokemon.displayName}
            isFavourite={isFavourite}
            onToggle={() => onToggleFavourite(pokemon.name)}
          />
        </div>
      )}
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
