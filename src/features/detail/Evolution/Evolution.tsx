import { useId } from 'react'
import { index } from '@/data/dataset'
import type { Evolution as EvolutionFamily } from '@/data/types/model'
import { evolutionAround } from '@/features/detail/evolution'
import { PokemonImage } from '@/features/pokemon/PokemonImage/PokemonImage'
import './Evolution.scss'

interface EvolutionProps {
  evolution: EvolutionFamily
  current: string
  onOpen: (name: string) => void
}

export function Evolution({ evolution, current, onOpen }: EvolutionProps) {
  const titleId = useId()
  const { previous, next } = evolutionAround(evolution, current)
  const stages = [previous, [current], next].filter((stage) => stage.length)

  return (
    <section className="evolution" aria-labelledby={titleId}>
      <h3 className="evolution__title" id={titleId}>
        Evolution
      </h3>
      <ol className="evolution__stages" aria-label="Evolution">
        {stages.map((stage) => (
          <li className="evolution__stage" key={stage.join()}>
            {stage.length === 1 ? (
              <EvolutionForm
                name={stage[0]}
                current={current}
                onOpen={onOpen}
              />
            ) : (
              <ul
                className="evolution__branch"
                aria-label="Evolves into one of"
              >
                {stage.map((name) => (
                  <li className="evolution__branch-form" key={name}>
                    <EvolutionForm
                      name={name}
                      current={current}
                      onOpen={onOpen}
                    />
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>
    </section>
  )
}

interface EvolutionFormProps {
  name: string
  current: string
  onOpen: (name: string) => void
}

function EvolutionForm({ name, current, onOpen }: EvolutionFormProps) {
  const pokemon = index.pokemon.get(name)
  if (!pokemon) {
    return null
  }
  const picture = (
    <span className="evolution__picture">
      <PokemonImage
        src={pokemon.artwork}
        name={pokemon.displayName}
        decorative
      />
    </span>
  )
  if (name === current) {
    return (
      <span className="evolution__form" aria-current="true">
        {picture}
        <span className="evolution__name">{pokemon.displayName}</span>
      </span>
    )
  }
  return (
    <button
      className="evolution__form"
      type="button"
      onClick={() => onOpen(name)}
    >
      {picture}
      <span className="evolution__name">{pokemon.displayName}</span>
    </button>
  )
}
