import type { EvalCase } from '@/eval/cases'
import { itemLabel } from '@/eval/format'
import { gradeOf, type Grade } from '@/eval/metrics'
import { keyOf } from '@/eval/run'
import { matchedOn } from '@/features/detail/matched-on'
import type { SearchResult } from '@/search/types/result'
import './RankedList.scss'

interface RankedListProps {
  results: SearchResult[]
  query: string
  /** Marks the right and forbidden answers; left out for a live query. */
  evalCase?: EvalCase
  /** Top N only, without scores; every result with its score and match otherwise. */
  limit?: number
}

const MARKS: Record<Exclude<Grade, null>, string> = {
  best: '✓',
  ok: '~',
  forbidden: '⛔',
}

export function RankedList({
  results,
  query,
  evalCase,
  limit,
}: RankedListProps) {
  if (!results.length) {
    return <p className="ranked-list__empty">nothing</p>
  }
  const shown = limit ? results.slice(0, limit) : results
  return (
    <ol className="ranked-list">
      {shown.map((result) => {
        const key = keyOf(result)
        const grade = evalCase ? gradeOf(evalCase, key) : null
        return (
          <li key={key} className="ranked-list__item" data-grade={grade}>
            {grade && `${MARKS[grade]} `}
            {itemLabel(key)}
            {!limit && (
              <span className="ranked-list__detail">
                {' '}
                {result.score.toFixed(2)} ·{' '}
                {matchedOn(result.matched, query, result.score).join('; ')}
              </span>
            )}
          </li>
        )
      })}
      {limit && results.length > limit && (
        <li className="ranked-list__more">+{results.length - limit}</li>
      )}
    </ol>
  )
}
