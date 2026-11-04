import { index } from '@/data/dataset'
import './PokemonLink.scss'

interface PokemonLinkProps {
  name: string
  onOpen: (name: string) => void
}

export function PokemonLink({ name, onOpen }: PokemonLinkProps) {
  return (
    <button className="pokemon-link" type="button" onClick={() => onOpen(name)}>
      {index.pokemon.get(name)?.displayName ?? name}
    </button>
  )
}
