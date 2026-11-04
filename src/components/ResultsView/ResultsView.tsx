import { useId } from 'react'
import {
  resultsInTab,
  tabCounts,
  type ResultTab,
} from '../../results/result-tabs'
import type { SearchResult } from '../../search/types/result'
import { ResultGrid } from '../ResultGrid/ResultGrid'
import { ResultTabs } from '../ResultTabs/ResultTabs'
import './ResultsView.scss'

interface ResultsViewProps {
  query: string
  results: SearchResult[]
  tab: ResultTab
  onTabChange: (tab: ResultTab) => void
}

export function ResultsView({
  query,
  results,
  tab,
  onTabChange,
}: ResultsViewProps) {
  const idPrefix = useId()
  const tabId = (resultTab: ResultTab) => `${idPrefix}-tab-${resultTab}`
  const panelId = `${idPrefix}-panel`

  return (
    <div className="results-view">
      <ResultTabs
        counts={tabCounts(results)}
        selected={tab}
        tabId={tabId}
        panelId={panelId}
        onSelect={onTabChange}
      />
      <div
        className="results-view__panel"
        id={panelId}
        role="tabpanel"
        aria-labelledby={tabId(tab)}
        tabIndex={0}
      >
        <ResultGrid
          query={query}
          tab={tab}
          results={resultsInTab(results, tab)}
        />
      </div>
    </div>
  )
}
