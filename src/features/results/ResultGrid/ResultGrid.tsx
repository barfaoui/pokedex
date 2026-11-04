import type { ResultTab } from '@/features/results/result-tabs'
import type { SearchResult } from '@/search/types/result'
import type { OpenItem } from '@/features/detail/open-item'
import { useFavourites } from '@/features/favourites/useFavourites'
import { AbilityCard } from '@/features/results/AbilityCard/AbilityCard'
import { MoveCard } from '@/features/results/MoveCard/MoveCard'
import { PokemonCard } from '@/features/results/PokemonCard/PokemonCard'
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
  onOpen: (item: OpenItem) => void
  selection?: { selected: string[]; onToggle: (name: string) => void }
}

export function ResultGrid({
  query,
  tab,
  results,
  onOpen,
  selection,
}: ResultGridProps) {
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
      {results.map((result) => {
        const open = () =>
          onOpen({
            kind: result.kind,
            name: result.item.name,
            matched: result.matched,
            score: result.score,
          })
        return (
          <li
            className="result-grid__item"
            key={`${result.kind}-${result.item.name}`}
          >
            {result.kind === 'pokemon' && (
              <PokemonCard
                result={result}
                isFavourite={favourites.includes(result.item.name)}
                onToggleFavourite={toggle}
                onOpen={open}
                selection={
                  selection && {
                    selected: selection.selected.includes(result.item.name),
                    onToggle: () => selection.onToggle(result.item.name),
                  }
                }
              />
            )}
            {result.kind === 'move' && (
              <MoveCard
                result={result}
                showKind={tab === 'all'}
                onOpen={open}
              />
            )}
            {result.kind === 'ability' && (
              <AbilityCard
                result={result}
                showKind={tab === 'all'}
                onOpen={open}
              />
            )}
          </li>
        )
      })}
    </ul>
  )
}
