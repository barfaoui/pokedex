import { useId } from 'react'
import { index } from '@/data/dataset'
import { displayName } from '@/data/display-name'
import type { Pokemon } from '@/data/types/model'
import { sharedTraits } from '@/features/compare/compare'
import { CompareStats } from '@/features/compare/CompareStats/CompareStats'
import { PokemonImage } from '@/features/pokemon/PokemonImage/PokemonImage'
import { TypeBadge } from '@/features/pokemon/TypeBadge/TypeBadge'
import { Overlay } from '@/shared/Overlay/Overlay'
import './CompareOverlay.scss'

interface CompareOverlayProps {
  left: Pokemon
  right: Pokemon
  onClose: () => void
}

export function CompareOverlay({ left, right, onClose }: CompareOverlayProps) {
  const titleId = useId()
  const shared = sharedTraits(left, right)

  return (
    <Overlay
      labelledBy={titleId}
      contentKey={`${left.name}-${right.name}`}
      onClose={onClose}
    >
      <article className="compare-overlay">
        <h2 className="compare-overlay__title" id={titleId}>
          Compare
        </h2>
        <div className="compare-overlay__columns">
          {[left, right].map((pokemon) => (
            <section className="compare-overlay__pokemon" key={pokemon.name}>
              <div className="compare-overlay__picture">
                <PokemonImage
                  src={pokemon.artwork}
                  name={pokemon.displayName}
                />
              </div>
              <h3 className="compare-overlay__name">{pokemon.displayName}</h3>
              <p className="compare-overlay__types">
                {pokemon.types.map((type) => (
                  <TypeBadge key={type} type={type} matchedOn={false} />
                ))}
              </p>
              <ul
                className="compare-overlay__abilities"
                aria-label={`${pokemon.displayName}'s abilities`}
              >
                {pokemon.abilities.map((ability) => (
                  <li className="compare-overlay__ability" key={ability}>
                    {index.abilities.get(ability)?.displayName ?? ability}
                    {shared.abilities.includes(ability) && (
                      <span className="compare-overlay__shared">shared</span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <CompareStats left={left} right={right} />
        {shared.types.length > 0 && (
          <p className="compare-overlay__summary">
            Shared: {shared.types.map(displayName).join(', ')} type
          </p>
        )}
      </article>
    </Overlay>
  )
}
