import type { Ability } from '@/data/types/model'
import { MatchedOn } from '@/features/detail/MatchedOn/MatchedOn'
import type { OpenItem } from '@/features/detail/open-item'
import { PokemonList } from '@/features/detail/PokemonList/PokemonList'
import './AbilityDetail.scss'

interface AbilityDetailProps {
  ability: Ability
  item: OpenItem
  query: string
  nameId: string
  onOpenPokemon: (name: string) => void
}

export function AbilityDetail({
  ability,
  item,
  query,
  nameId,
  onOpenPokemon,
}: AbilityDetailProps) {
  return (
    <article className="ability-detail">
      <h2 className="ability-detail__name" id={nameId}>
        {ability.displayName}
      </h2>
      <p className="ability-detail__kind">ability</p>
      <MatchedOn item={item} query={query} />
      <p className="ability-detail__effect">{ability.shortEffect}</p>
      {ability.effect !== ability.shortEffect && (
        <p className="ability-detail__full-effect">{ability.effect}</p>
      )}
      <PokemonList
        label={{ one: 'Pokémon that has it', many: 'Pokémons that have it' }}
        names={ability.pokemon}
        onOpen={onOpenPokemon}
      />
    </article>
  )
}
