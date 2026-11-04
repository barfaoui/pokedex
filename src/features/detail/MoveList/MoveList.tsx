import { useState } from 'react'
import { index } from '@/data/dataset'
import './MoveList.scss'

// Some Pokémon learn more than 50 moves: the list starts short.
const FIRST_MOVES = 8

interface MoveListProps {
  moves: string[]
}

export function MoveList({ moves }: MoveListProps) {
  const [showsAll, setShowsAll] = useState(false)
  const shown = showsAll ? moves : moves.slice(0, FIRST_MOVES)

  return (
    <div className="move-list">
      <ul className="move-list__moves" aria-label="Moves">
        {shown.map((move) => (
          <li className="move-list__move" key={move}>
            {index.moves.get(move)?.displayName ?? move}
          </li>
        ))}
      </ul>
      {!showsAll && moves.length > FIRST_MOVES && (
        <button
          className="move-list__show-all"
          type="button"
          onClick={() => setShowsAll(true)}
        >
          Show all {moves.length} moves
        </button>
      )}
    </div>
  )
}
