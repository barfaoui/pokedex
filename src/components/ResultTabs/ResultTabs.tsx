import { useRef, type KeyboardEvent } from 'react'
import { RESULT_TABS, type ResultTab } from '../../results/result-tabs'
import './ResultTabs.scss'

const TAB_LABELS: Record<ResultTab, string> = {
  all: 'All',
  pokemon: 'Pokémon',
  abilities: 'Abilities',
  moves: 'Moves',
}

interface ResultTabsProps {
  counts: Record<ResultTab, number>
  selected: ResultTab
  tabId: (tab: ResultTab) => string
  panelId: string
  onSelect: (tab: ResultTab) => void
}

export function ResultTabs({
  counts,
  selected,
  tabId,
  panelId,
  onSelect,
}: ResultTabsProps) {
  const tabRefs = useRef(new Map<ResultTab, HTMLButtonElement>())

  function selectAndFocus(tab: ResultTab) {
    onSelect(tab)
    tabRefs.current.get(tab)?.focus()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const index = RESULT_TABS.indexOf(selected)
    const last = RESULT_TABS.length - 1
    const target: Record<string, number> = {
      ArrowRight: index === last ? 0 : index + 1,
      ArrowDown: index === last ? 0 : index + 1,
      ArrowLeft: index === 0 ? last : index - 1,
      ArrowUp: index === 0 ? last : index - 1,
      Home: 0,
      End: last,
    }
    if (event.key in target) {
      event.preventDefault()
      selectAndFocus(RESULT_TABS[target[event.key]])
    }
  }

  return (
    <div className="result-tabs" role="tablist" aria-label="Result kinds">
      {RESULT_TABS.map((tab) => (
        <button
          key={tab}
          ref={(element) => {
            if (element) {
              tabRefs.current.set(tab, element)
            } else {
              tabRefs.current.delete(tab)
            }
          }}
          className="result-tabs__tab"
          id={tabId(tab)}
          type="button"
          role="tab"
          aria-selected={tab === selected}
          aria-controls={panelId}
          tabIndex={tab === selected ? 0 : -1}
          onClick={() => onSelect(tab)}
          onKeyDown={handleKeyDown}
        >
          {TAB_LABELS[tab]}{' '}
          <span className="result-tabs__count">{counts[tab]}</span>
        </button>
      ))}
    </div>
  )
}
