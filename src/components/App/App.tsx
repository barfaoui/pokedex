import { useState } from 'react'
import { AppHeader } from '../AppHeader/AppHeader'
import { SearchPage } from '../SearchPage/SearchPage'
import './App.scss'

function App() {
  const [query, setQuery] = useState('')

  return (
    <div className="app">
      <AppHeader />
      <SearchPage query={query} onQueryChange={setQuery} />
    </div>
  )
}

export default App
