import { useState } from 'react'
import { AppHeader } from '@/app/AppHeader/AppHeader'
import { SearchPage } from '@/app/SearchPage/SearchPage'
import { useUrlState } from '@/app/useUrlState'
import { index } from '@/data/dataset'
import { CompareControls } from '@/features/compare/CompareControls/CompareControls'
import { CompareOverlay } from '@/features/compare/CompareOverlay/CompareOverlay'
import { useSelection } from '@/features/compare/useSelection'
import type { ResultTab } from '@/features/results/result-tabs'
import './App.scss'

function App() {
  const [{ query, tab }, setUrlState] = useUrlState()
  const selection = useSelection()
  const [comparing, setComparing] = useState(false)
  const canStartComparing = tab === 'pokemon' && query.trim() !== ''
  const [left, right] = selection.selected.map((name) =>
    index.pokemon.get(name),
  )

  function changeTab(nextTab: ResultTab) {
    if (nextTab !== 'pokemon') {
      selection.cancel()
    }
    setUrlState({ query, tab: nextTab })
  }

  const compareControls = (placement: 'header' | 'floating') => (
    <CompareControls
      placement={placement}
      selection={selection}
      canStart={canStartComparing}
      onCompare={() => setComparing(true)}
    />
  )

  return (
    <div className="app">
      <AppHeader>{compareControls('header')}</AppHeader>
      <SearchPage
        query={query}
        tab={tab}
        selection={selection}
        onQueryChange={(nextQuery) => setUrlState({ query: nextQuery, tab })}
        onTabChange={changeTab}
      />
      {compareControls('floating')}
      {comparing && left && right && (
        <CompareOverlay
          left={left}
          right={right}
          onClose={() => setComparing(false)}
        />
      )}
    </div>
  )
}

export default App
