import { resultsInTab, type ResultTab } from '@/features/results/result-tabs'
import type { CardSelection } from '@/features/results/ResultGrid/ResultGrid'
import { search } from '@/search/search'
import { ExampleQueries } from '@/features/home/ExampleQueries/ExampleQueries'
import { NoResults } from '@/features/home/NoResults/NoResults'
import { ProfessorChen } from '@/features/home/ProfessorChen/ProfessorChen'
import { ResultsView } from '@/features/results/ResultsView/ResultsView'
import { SearchBar } from '@/features/home/SearchBar/SearchBar'
import './SearchPage.scss'

interface SearchPageProps {
  query: string
  tab: ResultTab
  cardSelection?: CardSelection
  onQueryChange: (query: string) => void
  onTabChange: (tab: ResultTab) => void
}

type PageState = 'home' | 'results' | 'no-results'

export function SearchPage({
  query,
  tab,
  cardSelection,
  onQueryChange,
  onTabChange,
}: SearchPageProps) {
  const isHome = query.trim() === ''
  const results = isHome ? [] : search(query)
  const state: PageState = isHome
    ? 'home'
    : results.length
      ? 'results'
      : 'no-results'

  return (
    <main className="search-page" data-state={state}>
      <div className="search-page__prompt">
        <ProfessorChen size={isHome ? 'large' : 'small'} />
        {isHome && (
          <h1 className="search-page__question">
            What are you looking for? Professor Chen is here to help
          </h1>
        )}
        <SearchBar query={query} onQueryChange={onQueryChange} />
        {isHome && <ExampleQueries onPick={onQueryChange} />}
      </div>
      {state === 'results' && (
        <ResultsView
          query={query}
          results={results}
          tab={tab}
          cardSelection={cardSelection}
          onTabChange={onTabChange}
        />
      )}
      {state === 'no-results' && (
        <NoResults query={query} onPick={onQueryChange} />
      )}
      <p className="search-page__count" role="status">
        {isHome ? '' : resultCountText(resultsInTab(results, tab).length)}
      </p>
    </main>
  )
}

function resultCountText(count: number): string {
  return count === 1 ? '1 result' : `${count} results`
}
