import { AppHeader } from '@/app/AppHeader/AppHeader'
import { SearchPage } from '@/app/SearchPage/SearchPage'
import { useUrlState } from '@/app/useUrlState'
import './App.scss'

function App() {
  const [{ query, tab }, setUrlState] = useUrlState()

  return (
    <div className="app">
      <AppHeader />
      <SearchPage
        query={query}
        tab={tab}
        onQueryChange={(nextQuery) => setUrlState({ query: nextQuery, tab })}
        onTabChange={(nextTab) => setUrlState({ query, tab: nextTab })}
      />
    </div>
  )
}

export default App
