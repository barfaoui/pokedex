import { index } from '@/data/dataset'
import { ModeButton } from '@/features/compare/ModeButton/ModeButton'
import { TEAM_SIZE } from '@/features/team/team'
import { TeamSlot } from '@/features/team/TeamSlot/TeamSlot'
import { Overlay } from '@/shared/Overlay/Overlay'
import { PixelArt } from '@/shared/PixelArt/PixelArt'
import './TeamOverlay.scss'

const SPARKLE = [
  '...#...',
  '...#...',
  '..###..',
  '#######',
  '..###..',
  '...#...',
  '...#...',
]

const SPARKLE_PIXELS = { '#': 'team-overlay__sparkle-pixel' }

interface TeamOverlayProps {
  team: string[]
  canAdd: boolean
  onRemove: (name: string) => void
  onAdd: () => void
  onClose: () => void
}

export function TeamOverlay({
  team,
  canAdd,
  onRemove,
  onAdd,
  onClose,
}: TeamOverlayProps) {
  const members = team.flatMap((name) => index.pokemon.get(name) ?? [])
  const isFull = members.length === TEAM_SIZE

  return (
    <Overlay title="My team" contentKey="team" onClose={onClose}>
      <section className="team-overlay">
        <p className="team-overlay__progress" aria-live="polite">
          {isFull ? (
            <>
              <Sparkle />
              Oh, what a dream team!
              <Sparkle />
            </>
          ) : (
            `${members.length} / ${TEAM_SIZE}`
          )}
        </p>
        {!members.length && (
          <p className="team-overlay__hint">
            Tick Pokémon on the Pokémon tab to add them to your team.
          </p>
        )}
        <ul className="team-overlay__slots" aria-label="Team">
          {members.map((member) => (
            <li className="team-overlay__slot" key={member.name}>
              <TeamSlot
                pokemon={member}
                onRemove={() => onRemove(member.name)}
              />
            </li>
          ))}
          {Array.from({ length: TEAM_SIZE - members.length }, (_, slot) => (
            // Empty slots have nothing to tell apart but their place
            <li className="team-overlay__empty" key={`empty-${slot}`}>
              Empty slot
            </li>
          ))}
        </ul>
        <div className="team-overlay__footer">
          {!isFull && (
            <ModeButton
              mode="team"
              label="Add Pokémon"
              hint="Open the Pokémon tab to add Pokémon"
              enabled={canAdd}
              onClick={onAdd}
            />
          )}
        </div>
      </section>
    </Overlay>
  )
}

function Sparkle() {
  return (
    <PixelArt
      className="team-overlay__sparkle"
      rows={SPARKLE}
      pixelClasses={SPARKLE_PIXELS}
    />
  )
}
