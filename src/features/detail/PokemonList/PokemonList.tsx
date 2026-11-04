import { index } from '@/data/dataset'
import { PokemonLink } from '@/features/detail/PokemonLink/PokemonLink'
import './PokemonList.scss'

interface PokemonListProps {
  label: { one: string; many: string }
  names: string[]
  onOpen: (name: string) => void
}

export function PokemonList({ label, names, onOpen }: PokemonListProps) {
  const title = names.length === 1 ? label.one : label.many
  const byPokedexNumber = [...names].sort(
    (a, b) => (index.pokemon.get(a)?.id ?? 0) - (index.pokemon.get(b)?.id ?? 0),
  )

  return (
    <section className="pokemon-list">
      <h3 className="pokemon-list__title">
        {title} ({names.length})
      </h3>
      <ul className="pokemon-list__names" aria-label={title}>
        {byPokedexNumber.map((name) => (
          <li className="pokemon-list__name" key={name}>
            <PokemonLink name={name} onOpen={onOpen} />
          </li>
        ))}
      </ul>
    </section>
  )
}
