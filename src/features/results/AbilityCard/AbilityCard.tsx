import { useId } from 'react'
import type { Ability } from '@/data/types/model'
import { describeMatches } from '@/features/results/describe-match'
import type { Scored } from '@/search/types/result'
import { MatchList } from '@/features/results/MatchList/MatchList'
import { ResultCard } from '@/features/results/ResultCard/ResultCard'
import './AbilityCard.scss'

interface AbilityCardProps {
  result: { item: Ability } & Scored
  showKind: boolean
  onOpen: () => void
}

export function AbilityCard({ result, showKind, onOpen }: AbilityCardProps) {
  const nameId = useId()
  const ability = result.item
  const showsEffect = !describeMatches(result.matched, 1).lines.length

  return (
    <ResultCard
      nameId={nameId}
      name={ability.displayName}
      score={result.score}
      onOpen={onOpen}
    >
      <h3 className="ability-card__name" id={nameId}>
        {ability.displayName}
      </h3>
      {showKind && <p className="ability-card__kind">ability</p>}
      {showsEffect ? (
        <p className="ability-card__effect">{ability.shortEffect}</p>
      ) : (
        <MatchList matches={result.matched} trimmed={false} />
      )}
      <p className="ability-card__count">
        {ability.pokemon.length === 1
          ? '1 Pokémon'
          : `${ability.pokemon.length} Pokémons`}
      </p>
    </ResultCard>
  )
}
