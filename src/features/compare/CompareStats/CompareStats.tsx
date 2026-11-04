import type { Pokemon } from '@/data/types/model'
import { compareStats, type StatComparison } from '@/features/compare/compare'
import { STAT_LABELS } from '@/features/results/describe-match'
import './CompareStats.scss'

const ARROWS = { higher: '▲', lower: '▼', same: '=' }

interface CompareStatsProps {
  left: Pokemon
  right: Pokemon
}

export function CompareStats({ left, right }: CompareStatsProps) {
  return (
    <ul className="compare-stats" aria-label="Stats">
      {compareStats(left, right).map((row) => (
        <li className="compare-stats__row" key={row.stat}>
          <StatValue
            value={row.left}
            standing={standing(row, 'left')}
            side="left"
          />
          <span className="compare-stats__label">
            {row.stat === 'total' ? 'total' : STAT_LABELS[row.stat]}
          </span>
          <StatValue
            value={row.right}
            standing={standing(row, 'right')}
            side="right"
          />
        </li>
      ))}
    </ul>
  )
}

type Standing = keyof typeof ARROWS

function standing(row: StatComparison, side: 'left' | 'right'): Standing {
  if (row.higher === 'tie') {
    return 'same'
  }
  return row.higher === side ? 'higher' : 'lower'
}

interface StatValueProps {
  value: number
  standing: Standing
  side: 'left' | 'right'
}

function StatValue({ value, standing, side }: StatValueProps) {
  const arrow = (
    <span className="compare-stats__arrow" aria-hidden="true">
      {ARROWS[standing]}
    </span>
  )
  return (
    <span
      className="compare-stats__value"
      data-side={side}
      data-standing={standing}
    >
      {side === 'left' && <>{arrow} </>}
      {value}
      {side === 'right' && <> {arrow}</>}
      <span className="compare-stats__standing"> ({standing})</span>
    </span>
  )
}
