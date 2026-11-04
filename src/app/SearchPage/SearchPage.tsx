import { resultsInTab, type ResultTab } from '@/features/results/result-tabs'
import type { CardSelection } from '@/features/results/ResultGrid/ResultGrid'
import { LabFilesWaiting } from '@/features/semantic/LabFilesWaiting/LabFilesWaiting'
import { SemanticUnavailable } from '@/features/semantic/SemanticUnavailable/SemanticUnavailable'
import { useSemanticSearch } from '@/features/semantic/useSemanticSearch'
import { ExclusionNote } from '@/features/results/ExclusionNote/ExclusionNote'
import { NO_EXCLUSIONS, withoutExcluded } from '@/search/exclusion'
import {
  needsSemantic,
  queryExclusions,
  search,
  semanticQueryOf,
} from '@/search/search'
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
  // Excluded words never reach the model, and "not" alone never triggers it.
  const semanticQuery = semanticQueryOf(query)
  const semantic = useSemanticSearch(
    semanticQuery,
    !isHome && semanticQuery !== '' && needsSemantic(manualResults),
  )
  const exclusions = isHome ? NO_EXCLUSIONS : queryExclusions(query)
  // A semantic result mustn't bring back what the query excludes.
  const results = withoutExcluded(
    withSemanticResults(manualResults, semantic.results),
    exclusions.rules,
  )
  const isWaiting =
    semantic.status === 'loading-model' ||
    (semantic.status === 'searching' && !results.length)
  const state: PageState = isHome
    ? 'home'
    : isWaiting
      ? 'waiting'
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
      {state === 'waiting' && <LabFilesWaiting />}
      {semantic.status === 'failed' && <SemanticUnavailable />}
      {state !== 'waiting' && <ExclusionNote exclusions={exclusions} />}
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
