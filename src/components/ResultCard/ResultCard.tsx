import type { ReactNode } from 'react'
import './ResultCard.scss'

interface ResultCardProps {
  nameId: string
  score: number
  children: ReactNode
}

export function ResultCard({ nameId, score, children }: ResultCardProps) {
  const isExact = score === 1

  return (
    <article
      className="result-card"
      aria-labelledby={nameId}
      data-exact={isExact}
    >
      {isExact && <span className="result-card__exact">Exact match</span>}
      {children}
    </article>
  )
}
