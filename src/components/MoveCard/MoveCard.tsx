import { useId } from 'react'
import type { Move } from '../../data/types/model'
import { describeMatches } from '../../results/describe-match'
import type { Scored } from '../../search/types/result'
import { MatchList } from '../MatchList/MatchList'
import { ResultCard } from '../ResultCard/ResultCard'
import { TypeBadge } from '../TypeBadge/TypeBadge'
import './MoveCard.scss'

interface MoveCardProps {
  result: { item: Move } & Scored
  showKind: boolean
}

export function MoveCard({ result, showKind }: MoveCardProps) {
  const nameId = useId()
  const move = result.item
  const learners = move.learnedBy.length
  const showsEffect = !describeMatches(result.matched, 1).lines.length

  return (
    <ResultCard nameId={nameId} score={result.score}>
      <h3 className="move-card__name" id={nameId}>
        {move.displayName}
      </h3>
      {(showKind || move.type) && (
        <p className="move-card__kind">
          {showKind && <span className="move-card__kind-label">move</span>}
          {move.type && (
            <TypeBadge
              type={move.type}
              matchedOn={result.matched.some(
                (match) => match.field === 'type' && match.value === move.type,
              )}
            />
          )}
        </p>
      )}
      {showsEffect ? (
        <p className="move-card__effect">{move.shortEffect}</p>
      ) : (
        <MatchList matches={result.matched} trimmed={false} />
      )}
      <p className="move-card__count">
        {learners} Pokémon {learners === 1 ? 'learns' : 'learn'} it
      </p>
    </ResultCard>
  )
}
