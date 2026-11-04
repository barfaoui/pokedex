import { search } from '../../search/search'
import { ExampleQueries } from '../ExampleQueries/ExampleQueries'
import { NoResults } from '../NoResults/NoResults'
import { ProfessorChen } from '../ProfessorChen/ProfessorChen'
import { SearchBar } from '../SearchBar/SearchBar'
import './SearchPage.scss'

interface SearchPageProps {
  query: string
  onQueryChange: (query: string) => void
}

type PageState = 'home' | 'results' | 'no-results'

export function SearchPage({ query, onQueryChange }: SearchPageProps) {
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
      {state === 'no-results' && (
        <NoResults query={query} onPick={onQueryChange} />
      )}
      <p
        className="search-page__count"
        role="status"
        data-visible={state === 'results'}
      >
        {resultCountText(state, results.length)}
      </p>
    </main>
  )
}

function resultCountText(state: PageState, count: number): string {
  if (state === 'home') {
    return ''
  }
  return count === 1 ? '1 result' : `${count} results`
}
