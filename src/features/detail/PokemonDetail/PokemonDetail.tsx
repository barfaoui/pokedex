import type { Pokemon } from '@/data/types/model'
import { index } from '@/data/dataset'
import { Evolution } from '@/features/detail/Evolution/Evolution'
import { MatchedOn } from '@/features/detail/MatchedOn/MatchedOn'
import { MoveList } from '@/features/detail/MoveList/MoveList'
import type { OpenItem } from '@/features/detail/open-item'
import { StatList } from '@/features/detail/StatList/StatList'
import { FavouriteButton } from '@/features/favourites/FavouriteButton/FavouriteButton'
import { useFavourites } from '@/features/favourites/useFavourites'
import { PokemonImage } from '@/features/pokemon/PokemonImage/PokemonImage'
import { TypeBadge } from '@/features/pokemon/TypeBadge/TypeBadge'
import './PokemonDetail.scss'

interface PokemonDetailProps {
  pokemon: Pokemon
  item: OpenItem
  query: string
  nameId: string
  onOpenPokemon: (name: string) => void
}

export function PokemonDetail({
  pokemon,
  item,
  query,
  nameId,
  onOpenPokemon,
}: PokemonDetailProps) {
  const { favourites, toggle } = useFavourites()
  const abilities = pokemon.abilities.map(
    (ability) => index.abilities.get(ability)?.displayName ?? ability,
  )

  return (
    <article className="pokemon-detail">
      <div className="pokemon-detail__picture-column">
        <div className="pokemon-detail__picture">
          <PokemonImage src={pokemon.artwork} name={pokemon.displayName} />
        </div>
        <p className="pokemon-detail__identity">
          <span className="pokemon-detail__number">#{pokemon.id}</span>
          {pokemon.types.map((type) => (
            <TypeBadge key={type} type={type} matchedOn={false} />
          ))}
          <span className="pokemon-detail__genus">{pokemon.genus}</span>
        </p>
      </div>
      <div className="pokemon-detail__info">
        <div className="pokemon-detail__title">
          <h2 className="pokemon-detail__name" id={nameId}>
            {pokemon.displayName}
          </h2>
          <FavouriteButton
            pokemonName={pokemon.displayName}
            isFavourite={favourites.includes(pokemon.name)}
            onToggle={() => toggle(pokemon.name)}
          />
        </div>
        <p className="pokemon-detail__description">“{pokemon.description}”</p>
        <MatchedOn item={item} query={query} />
        <StatList stats={pokemon.stats} />
        <dl className="pokemon-detail__facts">
          <dt className="pokemon-detail__fact-name">Abilities</dt>
          <dd className="pokemon-detail__fact">{abilities.join(', ')}</dd>
          <dt className="pokemon-detail__fact-name">Height</dt>
          <dd className="pokemon-detail__fact">{pokemon.heightM} m</dd>
          <dt className="pokemon-detail__fact-name">Weight</dt>
          <dd className="pokemon-detail__fact">{pokemon.weightKg} kg</dd>
          <dt className="pokemon-detail__fact-name">Moves</dt>
          <dd className="pokemon-detail__fact">
            <MoveList key={pokemon.name} moves={pokemon.moves} />
          </dd>
        </dl>
      </div>
      {pokemon.evolution && pokemon.evolution.members.length > 1 && (
        <div className="pokemon-detail__evolution">
          <Evolution
            evolution={pokemon.evolution}
            current={pokemon.name}
            onOpen={onOpenPokemon}
          />
        </div>
      )}
    </article>
  )
}
