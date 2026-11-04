import { useId } from 'react'
import { index } from '@/data/dataset'
import { AbilityDetail } from '@/features/detail/AbilityDetail/AbilityDetail'
import { MoveDetail } from '@/features/detail/MoveDetail/MoveDetail'
import { linkedItem, type OpenItem } from '@/features/detail/open-item'
import { PokemonDetail } from '@/features/detail/PokemonDetail/PokemonDetail'
import { Overlay } from '@/shared/Overlay/Overlay'

interface DetailOverlayProps {
  item: OpenItem
  query: string
  onOpen: (item: OpenItem) => void
  onBack?: () => void
  onClose: () => void
}

export function DetailOverlay({
  item,
  query,
  onOpen,
  onBack,
  onClose,
}: DetailOverlayProps) {
  const nameId = useId()
  const openPokemon = (name: string) => onOpen(linkedItem('pokemon', name))

  return (
    <Overlay
      labelledBy={nameId}
      contentKey={`${item.kind}-${item.name}`}
      onClose={onClose}
      onBack={onBack}
    >
      <DetailContent
        item={item}
        query={query}
        nameId={nameId}
        onOpenPokemon={openPokemon}
      />
    </Overlay>
  )
}

interface DetailContentProps {
  item: OpenItem
  query: string
  nameId: string
  onOpenPokemon: (name: string) => void
}

function DetailContent({ item, ...props }: DetailContentProps) {
  switch (item.kind) {
    case 'pokemon': {
      const pokemon = index.pokemon.get(item.name)
      return (
        pokemon && <PokemonDetail pokemon={pokemon} item={item} {...props} />
      )
    }
    case 'move': {
      const move = index.moves.get(item.name)
      return move && <MoveDetail move={move} item={item} {...props} />
    }
    case 'ability': {
      const ability = index.abilities.get(item.name)
      return (
        ability && <AbilityDetail ability={ability} item={item} {...props} />
      )
    }
  }
}
