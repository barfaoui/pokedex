import { useState } from 'react'
import { AppHeader } from '@/app/AppHeader/AppHeader'
import { SearchPage } from '@/app/SearchPage/SearchPage'
import { useUrlState } from '@/app/useUrlState'
import { index } from '@/data/dataset'
import { CompareOverlay } from '@/features/compare/CompareOverlay/CompareOverlay'
import { SelectionControls } from '@/features/compare/SelectionControls/SelectionControls'
import { useSelection } from '@/features/compare/useSelection'
import { PokedexButton } from '@/features/favourites/PokedexButton/PokedexButton'
import { PokedexOverlay } from '@/features/favourites/PokedexOverlay/PokedexOverlay'
import { useFavourites } from '@/features/favourites/useFavourites'
import type { CardSelection } from '@/features/results/ResultGrid/ResultGrid'
import type { ResultTab } from '@/features/results/result-tabs'
import { TeamOverlay } from '@/features/team/TeamOverlay/TeamOverlay'
import { useTeam } from '@/features/team/useTeam'
import './App.scss'

type OpenWindow = 'compare' | 'pokedex' | 'team' | null

function App() {
  const [{ query, tab }, setUrlState] = useUrlState()
  const selection = useSelection()
  const favourites = useFavourites()
  const team = useTeam()
  const [openWindow, setOpenWindow] = useState<OpenWindow>(null)
  const canStartSelection = tab === 'pokemon' && query.trim() !== ''
  const [left, right] = selection.selected.map((name) =>
    index.pokemon.get(name),
  )

  const cardSelection: CardSelection | undefined =
    selection.mode === 'compare'
      ? { selected: selection.selected, onToggle: selection.toggle }
      : selection.mode === 'team'
        ? { selected: team.team, onToggle: team.toggle }
        : undefined

  function changeTab(nextTab: ResultTab) {
    if (nextTab !== 'pokemon') {
      selection.cancel()
    }
    setUrlState({ query, tab: nextTab })
  }

  function addToTeam() {
    setOpenWindow(null)
    selection.start('team')
  }

  const selectionControls = (placement: 'header' | 'floating') => (
    <SelectionControls
      placement={placement}
      selection={selection}
      teamSize={team.team.length}
      canStart={canStartSelection}
      onCompare={() => setOpenWindow('compare')}
      onOpenTeam={() => setOpenWindow('team')}
    />
  )

  return (
    <div className="app">
      <AppHeader>
        <div className="app__actions">
          {selectionControls('header')}
          <PokedexButton
            count={favourites.favourites.length}
            onOpen={() => setOpenWindow('pokedex')}
          />
        </div>
      </AppHeader>
      <SearchPage
        query={query}
        tab={tab}
        cardSelection={cardSelection}
        onQueryChange={(nextQuery) => setUrlState({ query: nextQuery, tab })}
        onTabChange={changeTab}
      />
      {selectionControls('floating')}
      {openWindow === 'compare' && left && right && (
        <CompareOverlay
          left={left}
          right={right}
          onClose={() => setOpenWindow(null)}
        />
      )}
      {openWindow === 'pokedex' && (
        <PokedexOverlay
          favourites={favourites.favourites}
          onRemove={favourites.toggle}
          onClose={() => setOpenWindow(null)}
        />
      )}
      {openWindow === 'team' && (
        <TeamOverlay
          team={team.team}
          canAdd={canStartSelection}
          onRemove={team.toggle}
          onAdd={addToTeam}
          onClose={() => setOpenWindow(null)}
        />
      )}
    </div>
  )
}

export default App
