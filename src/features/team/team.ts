import { parseSavedNames } from '@/shared/useSavedList'

export const TEAM_SIZE = 6

/** A full team ignores new members: a team is built on purpose, so no one is pushed out. */
export function toggleTeamMember(team: string[], name: string): string[] {
  if (team.includes(name)) {
    return team.filter((member) => member !== name)
  }
  return team.length < TEAM_SIZE ? [...team, name] : team
}

export function parseTeam(stored: string | null): string[] {
  return [...new Set(parseSavedNames(stored))].slice(0, TEAM_SIZE)
}
