import { useId } from 'react'
import type { Pokemon } from '@/data/types/model'
import { PokemonImage } from '@/features/pokemon/PokemonImage/PokemonImage'
import './TeamSlot.scss'

interface TeamSlotProps {
  pokemon: Pokemon
  onRemove: () => void
}

export function TeamSlot({ pokemon, onRemove }: TeamSlotProps) {
  const nameId = useId()

  return (
    <article className="team-slot" aria-labelledby={nameId}>
      <div className="team-slot__picture">
        <PokemonImage
          src={pokemon.artwork}
          name={pokemon.displayName}
          decorative
        />
      </div>
      <div className="team-slot__footer">
        <h3 className="team-slot__name" id={nameId}>
          {pokemon.displayName}
        </h3>
        <button
          className="team-slot__remove"
          type="button"
          aria-label={`Remove ${pokemon.displayName} from the team`}
          onClick={onRemove}
        >
          ✕<span className="team-slot__remove-word"> remove</span>
        </button>
      </div>
    </article>
  )
}
