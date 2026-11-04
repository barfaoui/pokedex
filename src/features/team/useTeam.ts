import { useCallback } from 'react'
import { parseTeam, toggleTeamMember } from '@/features/team/team'
import { useSavedList } from '@/shared/useSavedList'

export function useTeam() {
  const [team, update] = useSavedList('pokedex.team', parseTeam)
  const toggle = useCallback(
    (name: string) => update((current) => toggleTeamMember(current, name)),
    [update],
  )
  return { team, toggle }
}
