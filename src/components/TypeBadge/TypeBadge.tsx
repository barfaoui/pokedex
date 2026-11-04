import { displayName } from '../../data/display-name'
import type { PokemonType } from '../../data/types/model'
import './TypeBadge.scss'

interface TypeBadgeProps {
  type: PokemonType
  matchedOn: boolean
}

export function TypeBadge({ type, matchedOn: matchedOn }: TypeBadgeProps) {
  return (
    <span className="type-badge" data-type={type} data-matched={matchedOn}>
      {displayName(type)}
      {matchedOn && <span className="type-badge__matchedOn"> (matched)</span>}
    </span>
  )
}
