import type { ResultTab } from '../../results/result-tabs'
import type { SearchResult } from '../../search/types/result'
import { useFavourites } from '../../favourites/useFavourites'
import { AbilityCard } from '../AbilityCard/AbilityCard'
import { MoveCard } from '../MoveCard/MoveCard'
import { PokemonCard } from '../PokemonCard/PokemonCard'
import './ResultGrid.scss'

const EMPTY_TAB_NAMES: Record<ResultTab, string> = {
  all: 'results',
  pokemon: 'Pokémon',
  abilities: 'abilities',
  moves: 'moves',
}

interface ResultGridProps {
  query: string
  tab: ResultTab
  results: SearchResult[]
}

export function ResultGrid({ query, tab, results }: ResultGridProps) {
  const { favourites, toggle } = useFavourites()

  if (!results.length) {
    return (
      <p className="result-grid__empty">
        No {EMPTY_TAB_NAMES[tab]} for “{query.trim()}”.
      </p>
    )
  }

  return (
    <ul className="result-grid">
      {results.map((result) => (
        <li
          className="result-grid__item"
          key={`${result.kind}-${result.item.name}`}
        >
          {result.kind === 'pokemon' && (
            <PokemonCard
              result={result}
              isFavourite={favourites.includes(result.item.name)}
              onToggleFavourite={toggle}
            />
          )}
          {result.kind === 'move' && (
            <MoveCard result={result} showKind={tab === 'all'} />
          )}
          {result.kind === 'ability' && (
            <AbilityCard result={result} showKind={tab === 'all'} />
          )}
        </li>
      ))}
    </ul>
  )
}
