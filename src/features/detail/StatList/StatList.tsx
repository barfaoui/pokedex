import { STAT_NAMES, type StatName } from '@/data/types/model'
import { STAT_LABELS, STAT_MAX } from '@/features/results/describe-match'
import { StatBar } from '@/shared/StatBar/StatBar'
import './StatList.scss'

interface StatListProps {
  stats: Record<StatName, number>
}

export function StatList({ stats }: StatListProps) {
  return (
    <ul className="stat-list" aria-label="Stats">
      {STAT_NAMES.map((stat) => (
        <li className="stat-list__stat" key={stat}>
          <span className="stat-list__label">{STAT_LABELS[stat]}</span>
          <span className="stat-list__value">{stats[stat]}</span>
          <StatBar value={stats[stat]} max={STAT_MAX} />
        </li>
      ))}
    </ul>
  )
}
