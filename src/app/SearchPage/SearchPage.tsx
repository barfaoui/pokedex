import { resultsInTab, type ResultTab } from '@/features/results/result-tabs'
import type { CardSelection } from '@/features/results/ResultGrid/ResultGrid'
import { LabFilesWaiting } from '@/features/semantic/LabFilesWaiting/LabFilesWaiting'
import { SemanticUnavailable } from '@/features/semantic/SemanticUnavailable/SemanticUnavailable'
import { useSemanticSearch } from '@/features/semantic/useSemanticSearch'
import { needsSemantic, search } from '@/search/search'
import { withSemanticResults } from '@/search/semantic/semantic'
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

// 'waiting': only search by meaning can still answer, and it's busy (its model loading, or the query)
type PageState = 'home' | 'results' | 'waiting' | 'no-results'

export function SearchPage({
  query,
  tab,
  cardSelection,
  onQueryChange,
  onTabChange,
}: SearchPageProps) {
  const isHome = query.trim() === ''
  const manualResults = isHome ? [] : search(query)
  const semantic = useSemanticSearch(
    query,
    !isHome && needsSemantic(manualResults),
  )
  const results = withSemanticResults(manualResults, semantic.results)
  const isSearchingByMeaning =
    semantic.status === 'loading-model' || semantic.status === 'searching'
  const state: PageState = isHome
    ? 'home'
    : results.length
      ? 'results'
      : isSearchingByMeaning
        ? 'waiting'
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
      {semantic.status === 'loading-model' && <LabFilesWaiting />}
      {semantic.status === 'failed' && <SemanticUnavailable />}
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
        {isHome || state === 'waiting'
          ? ''
          : resultCountText(resultsInTab(results, tab).length)}
      </p>
    </main>
  )
}

function resultCountText(count: number): string {
  return count === 1 ? '1 result' : `${count} results`
}
