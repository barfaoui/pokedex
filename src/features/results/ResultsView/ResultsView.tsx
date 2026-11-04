import { useId, useState } from 'react'
import { DetailOverlay } from '@/features/detail/DetailOverlay/DetailOverlay'
import type { OpenItem } from '@/features/detail/open-item'
import {
  resultsInTab,
  tabCounts,
  type ResultTab,
} from '@/features/results/result-tabs'
import type { SearchResult } from '@/search/types/result'
import {
  ResultGrid,
  type CardSelection,
} from '@/features/results/ResultGrid/ResultGrid'
import { ResultTabs } from '@/features/results/ResultTabs/ResultTabs'
import './ResultsView.scss'

interface ResultsViewProps {
  query: string
  results: SearchResult[]
  tab: ResultTab
  /** In selection mode, the ticked Pokémon and what a tick does. */
  cardSelection?: CardSelection
  onTabChange: (tab: ResultTab) => void
}

export function ResultsView({
  query,
  results,
  tab,
  cardSelection,
  onTabChange,
}: ResultsViewProps) {
  const idPrefix = useId()
  const [openStack, setOpenStack] = useState<OpenItem[]>([])
  const openItem = openStack.at(-1)
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
          onOpen={(item) => setOpenStack([item])}
          selection={tab === 'pokemon' ? cardSelection : undefined}
        />
      </div>
      {openItem && (
        <DetailOverlay
          item={openItem}
          query={query}
          onOpen={(item) => setOpenStack((stack) => [...stack, item])}
          onBack={
            openStack.length > 1
              ? () => setOpenStack((stack) => stack.slice(0, -1))
              : undefined
          }
          onClose={() => setOpenStack([])}
        />
      )}
    </div>
  )
}
