import { displayName } from '@/data/display-name'
import type { StatName } from '@/data/types/model'
import { STAT_SCALE } from '@/features/results/stat-scale'
import type { Match } from '@/search/types/result'

export type MatchLine =
  | { kind: 'stat'; label: string; value: number; max: number }
  | { kind: 'text'; label: string; detail?: string }

export const STAT_LABELS: Record<StatName, string> = {
  hp: 'HP',
  attack: 'attack',
  defense: 'defense',
  'special-attack': 'sp. attack',
  'special-defense': 'sp. defense',
  speed: 'speed',
}

export const DESCRIPTOR_LABELS = {
  color: 'colour',
  habitat: 'habitat',
  shape: 'shape',
} as const

/** What a card shows for one match; undefined when the card already shows it (name, type). */
export function describeMatch(match: Match): MatchLine | undefined {
  const { field, value } = match
  switch (field) {
    case 'name':
    case 'type':
      return undefined
    case 'hp':
    case 'attack':
    case 'defense':
    case 'special-attack':
    case 'special-defense':
    case 'speed':
      return {
        kind: 'stat',
        label: STAT_LABELS[field],
        value: Number(value),
        max: STAT_SCALE[field],
      }
    case 'total':
      return {
        kind: 'stat',
        label: 'total',
        value: Number(value),
        max: STAT_SCALE.total,
      }
    case 'height':
      return { kind: 'text', label: `height ${value} m` }
    case 'weight':
      return { kind: 'text', label: `weight ${value} kg` }
    case 'color':
    case 'habitat':
    case 'shape':
      return {
        kind: 'text',
        label: `${DESCRIPTOR_LABELS[field]} ${String(value).replaceAll('-', ' ')}`,
      }
    case 'move':
    case 'ability':
      return withDetail(displayName(String(value)), match.detail)
    case 'effect':
      return withDetail(
        match.direction ? capitalise(match.direction) : 'Effect',
        String(value),
      )
    case 'description':
      return withDetail('Description', match.detail ?? String(value))
    case 'number':
      return { kind: 'text', label: `#${value}` }
    case 'evolutionOf':
      return {
        kind: 'text',
        label: `Evolution of ${displayName(String(value))}`,
      }
    case 'evolvesInto':
      return {
        kind: 'text',
        label: `Evolves into ${displayName(String(value))}`,
      }
  }
}

/** The first `limit` lines a card shows, and how many more there are. */
export function describeMatches(
  matches: Match[],
  limit: number,
): { lines: MatchLine[]; moreCount: number } {
  const lines = matches
    .map(describeMatch)
    .filter((line): line is MatchLine => line !== undefined)
  return {
    lines: lines.slice(0, limit),
    moreCount: Math.max(0, lines.length - limit),
  }
}

function withDetail(label: string, detail: string | undefined): MatchLine {
  return detail ? { kind: 'text', label, detail } : { kind: 'text', label }
}

function capitalise(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1)
}
