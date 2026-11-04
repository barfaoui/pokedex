import { matchedOn } from '@/features/detail/matched-on'
import type { OpenItem } from '@/features/detail/open-item'
import './MatchedOn.scss'

interface MatchedOnProps {
  item: OpenItem
  query: string
}

export function MatchedOn({ item, query }: MatchedOnProps) {
  const phrases = matchedOn(item.matched, query, item.score)
  if (!phrases.length) {
    return null
  }

  return (
    <p className="matched-on">
      <span className="matched-on__label">Matched on:</span>{' '}
      {phrases.join(' · ')}
    </p>
  )
}
