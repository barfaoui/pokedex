import { displayName } from '@/data/display-name'
import { describeMatch } from '@/features/results/describe-match'
import type { Match } from '@/search/types/result'

export function matchedOn(
  matches: Match[],
  query: string,
  score: number,
): string[] {
  return matches.map((match) => matchPhrase(match, query, score))
}

function matchPhrase(match: Match, query: string, score: number): string {
  if (match.field === 'name') {
    const typed = `name “${query.trim()}”`
    return score < 1 ? `${typed} (close match)` : typed
  }
  if (match.field === 'type') {
    return `type ${displayName(String(match.value))}`
  }
  const line = describeMatch(match)
  if (!line) {
    return String(match.value)
  }
  if (line.kind === 'stat') {
    return `${line.label} ${line.value}`
  }
  return line.detail ? `${line.label} · ${line.detail}` : line.label
}
