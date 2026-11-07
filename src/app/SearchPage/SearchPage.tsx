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
import { AssistantLine } from '@/features/ask-ai/AssistantLine/AssistantLine'
import { AskAiSuggestion } from '@/features/ask-ai/AskAiSuggestion/AskAiSuggestion'
import { suggestsAskAi } from '@/features/ask-ai/ask-ai-suggestion'
import { useAskAi } from '@/features/ask-ai/useAskAi'
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
  const deterministicResults = isHome ? [] : search(query)
  // Excluded words never reach the model, and "not" alone never triggers it.
  const semanticQuery = semanticQueryOf(query)
  const semantic = useSemanticSearch(
    semanticQuery,
    !isHome && semanticQuery !== '' && needsSemantic(deterministicResults),
  )
  const exclusions = isHome ? NO_EXCLUSIONS : queryExclusions(query)
  // A semantic result mustn't bring back what the query excludes.
  const searchResults = withoutExcluded(
    withSemanticResults(deterministicResults, semantic.results),
    exclusions.rules,
  )
  // An AI answer belongs to the query it was asked for: typing anything else is the usual search.
  const ai = useAskAi()
  const aiState = ai.state?.query === query && !isHome ? ai.state : null
  // An answer replaces the results, even an empty one: only a failure keeps the usual search.
  const aiShown =
    aiState?.status === 'done' && !aiState.note ? aiState.results : null
  const results = aiShown ?? searchResults
  const isWaiting =
    !aiShown &&
    (semantic.status === 'loading-model' ||
      (semantic.status === 'searching' && !results.length))
  const state: PageState = isHome
    ? 'home'
    : isWaiting
      ? 'waiting'
      : results.length
        ? 'results'
        : 'no-results'
  const suggestsAi =
    !isHome &&
    suggestsAskAi({
      available: ai.available,
      settled:
        semantic.status !== 'searching' && semantic.status !== 'loading-model',
      askedAi: aiState !== null,
      deterministic: deterministicResults,
    })

  return (
    <main className="search-page" data-state={state}>
      <div className="search-page__prompt">
        <ProfessorChen size={isHome ? 'large' : 'small'} />
        {isHome && (
          <h1 className="search-page__question">
            What are you looking for? Professor Chen is here to help
          </h1>
        )}
        <SearchBar
          query={query}
          onQueryChange={onQueryChange}
          onAskAi={ai.available ? () => ai.ask(query) : undefined}
          askingAi={aiState?.status === 'asking'}
        />
        {isHome && <ExampleQueries onPick={onQueryChange} />}
      </div>
      {aiState && (
        <AssistantLine state={aiState} shown={aiShown?.length ?? 0} />
      )}
      {state === 'waiting' && <LabFilesWaiting />}
      {semantic.status === 'failed' && <SemanticUnavailable />}
      {state !== 'waiting' && !aiShown && (
        <ExclusionNote exclusions={exclusions} />
      )}
      {state === 'results' && (
        <ResultsView
          query={query}
          results={results}
          tab={tab}
          cardSelection={cardSelection}
          onTabChange={onTabChange}
        />
      )}
      {state === 'no-results' && !aiShown && (
        <NoResults query={query} onPick={onQueryChange} />
      )}
      {suggestsAi && <AskAiSuggestion onAsk={() => ai.ask(query)} />}
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
