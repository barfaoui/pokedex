import { describe, expect, test } from 'vitest'
import { parseTeam, toggleTeamMember } from '@/features/team/team'

const SIX = ['pikachu', 'raichu', 'jolteon', 'lapras', 'voltorb', 'zapdos']

describe('toggleTeamMember', () => {
  test('adds a Pokémon at the end of the team', () => {
    expect(toggleTeamMember(['pikachu'], 'raichu')).toEqual([
      'pikachu',
      'raichu',
    ])
  })

  test('removes a Pokémon already in the team', () => {
    expect(toggleTeamMember(['pikachu', 'raichu'], 'pikachu')).toEqual([
      'raichu',
    ])
  })

  test('a seventh Pokémon is not added: the team stays as it is', () => {
    expect(toggleTeamMember(SIX, 'eevee')).toBe(SIX)
  })

  test('a full team can still lose a member', () => {
    expect(toggleTeamMember(SIX, 'lapras')).toHaveLength(5)
  })
})

describe('parseTeam', () => {
  // Reading and unreadable values are parseSavedNames, tested through parseFavourites.
  test('keeps six at most, each Pokémon once', () => {
    expect(parseTeam(JSON.stringify([...SIX, 'eevee', 'pikachu']))).toEqual(SIX)
    expect(parseTeam('["pikachu","pikachu"]')).toEqual(['pikachu'])
  })
})
