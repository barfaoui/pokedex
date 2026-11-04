import {
  describeMatches,
  type MatchLine,
} from '@/features/results/describe-match'
import type { Match } from '@/search/types/result'
import { StatBar } from '@/shared/StatBar/StatBar'
import './MatchList.scss'

const SHOWN_MATCHES = 2

interface MatchListProps {
  matches: Match[]
  trimmed?: boolean
}

export function MatchList({ matches, trimmed = true }: MatchListProps) {
  const { lines, moreCount } = describeMatches(matches, SHOWN_MATCHES)
  if (!lines.length) {
    return null
  }

  return (
    <ul className="match-list" aria-label="What matched" data-trimmed={trimmed}>
      {lines.map((line) => (
        <li className="match-list__line" key={line.label}>
          <MatchLineContent line={line} />
        </li>
      ))}
      {moreCount > 0 && <li className="match-list__more">+{moreCount} more</li>}
    </ul>
  )
}

function MatchLineContent({ line }: { line: MatchLine }) {
  if (line.kind === 'stat') {
    return (
      <span className="match-list__stat">
        <span className="match-list__label">{line.label}</span>
        <span className="match-list__value">{line.value}</span>
        <StatBar value={line.value} max={line.max} />
      </span>
    )
  }
  return (
    <>
      <span className="match-list__label">{line.label}</span>
      {line.detail && (
        <span className="match-list__detail"> · {line.detail}</span>
      )}
    </>
  )
}
