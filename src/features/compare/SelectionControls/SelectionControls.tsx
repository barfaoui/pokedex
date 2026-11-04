import { useRef } from 'react'
import { ModeButton } from '@/features/compare/ModeButton/ModeButton'
import { SelectionBar } from '@/features/compare/SelectionBar/SelectionBar'
import type { Selection } from '@/features/compare/useSelection'
import { TEAM_SIZE } from '@/features/team/team'
import './SelectionControls.scss'

interface SelectionControlsProps {
  /** The header on desktop, a floating group on phones: each is hidden on the other screen size. */
  placement: 'header' | 'floating'
  selection: Selection
  teamSize: number
  /** Selection mode starts from the Pokémon tab only. */
  canStart: boolean
  onCompare: () => void
  onOpenTeam: () => void
}

export function SelectionControls({
  placement,
  selection,
  teamSize,
  canStart,
  onCompare,
  onOpenTeam,
}: SelectionControlsProps) {
  const controlsRef = useRef<HTMLDivElement>(null)
  const teamLabel = `My team (${teamSize} / ${TEAM_SIZE})`

  // ✕ disappears with the selection: focus moves to the button that started it instead of falling to the page
  function cancel() {
    const mode = selection.mode
    selection.cancel()
    requestAnimationFrame(() =>
      controlsRef.current
        ?.querySelector<HTMLButtonElement>(`[data-mode="${mode}"]`)
        ?.focus(),
    )
  }

  // Floating buttons only show where they work; the header ones stay, greyed out
  const showsCompare = placement === 'header' || canStart
  const showsTeam = placement === 'header' || canStart || teamSize > 0
  if (!selection.mode && !showsCompare && !showsTeam) {
    return null
  }

  return (
    <div
      ref={controlsRef}
      className="selection-controls"
      data-placement={placement}
    >
      {selection.mode === 'compare' && (
        <SelectionBar
          actionLabel={`Compare 2 (${selection.selected.length})`}
          actionEnabled={selection.selected.length === 2}
          announcement={`${selection.selected.length} selected`}
          onAction={onCompare}
          onCancel={cancel}
        />
      )}
      {selection.mode === 'team' && (
        <SelectionBar
          actionLabel={teamLabel}
          actionEnabled
          announcement={`${teamSize} in the team`}
          onAction={onOpenTeam}
          onCancel={cancel}
        />
      )}
      {!selection.mode && showsCompare && (
        <ModeButton
          mode="compare"
          label="Compare 2"
          hint="Open the Pokémon tab to compare"
          enabled={canStart}
          onClick={() => selection.start('compare')}
        />
      )}
      {!selection.mode &&
        showsTeam &&
        (teamSize > 0 ? (
          <ModeButton
            mode="team"
            label={teamLabel}
            hint=""
            enabled
            onClick={onOpenTeam}
          />
        ) : (
          <ModeButton
            mode="team"
            label="Create a team"
            hint="Open the Pokémon tab to build a team"
            enabled={canStart}
            onClick={() => selection.start('team')}
          />
        ))}
    </div>
  )
}
