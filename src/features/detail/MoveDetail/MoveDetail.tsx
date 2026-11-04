import { displayName } from '@/data/display-name'
import type { Move } from '@/data/types/model'
import { MatchedOn } from '@/features/detail/MatchedOn/MatchedOn'
import type { OpenItem } from '@/features/detail/open-item'
import { PokemonList } from '@/features/detail/PokemonList/PokemonList'
import { TypeBadge } from '@/features/pokemon/TypeBadge/TypeBadge'
import './MoveDetail.scss'

interface MoveDetailProps {
  move: Move
  item: OpenItem
  query: string
  nameId: string
  onOpenPokemon: (name: string) => void
}

export function MoveDetail({
  move,
  item,
  query,
  nameId,
  onOpenPokemon,
}: MoveDetailProps) {
  return (
    <article className="move-detail">
      <h2 className="move-detail__name" id={nameId}>
        {move.displayName}
      </h2>
      <p className="move-detail__kind">
        move
        {move.type && <TypeBadge type={move.type} matchedOn={false} />}
        {move.damageClass && (
          <span className="move-detail__class">
            {displayName(move.damageClass)}
          </span>
        )}
      </p>
      <MatchedOn item={item} query={query} />
      <dl className="move-detail__facts">
        <dt className="move-detail__fact-name">Power</dt>
        <dd className="move-detail__fact">{move.power ?? '—'}</dd>
        <dt className="move-detail__fact-name">Accuracy</dt>
        <dd className="move-detail__fact">
          {move.accuracy === null ? '—' : `${move.accuracy}%`}
        </dd>
        <dt className="move-detail__fact-name">PP</dt>
        <dd className="move-detail__fact">{move.pp}</dd>
      </dl>
      <p className="move-detail__effect">{move.shortEffect}</p>
      {move.effect !== move.shortEffect && (
        <p className="move-detail__full-effect">{move.effect}</p>
      )}
      <PokemonList
        label={{
          one: 'Pokémon that learns it',
          many: 'Pokémons that learn it',
        }}
        names={move.learnedBy}
        onOpen={onOpenPokemon}
      />
    </article>
  )
}
