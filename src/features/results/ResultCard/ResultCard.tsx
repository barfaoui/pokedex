import type { ReactNode } from 'react'
import './ResultCard.scss'

interface ResultCardProps {
  nameId: string
  name: string
  score: number
  onOpen: () => void
  children: ReactNode
}

// The open button covers the whole card; other buttons sit above it.
export function ResultCard({
  nameId,
  name,
  score,
  onOpen,
  children,
}: ResultCardProps) {
  const isExact = score === 1

  return (
    <article
      className="result-card"
      aria-labelledby={nameId}
      data-exact={isExact}
    >
      {isExact && <span className="result-card__exact">Exact match</span>}
      <button
        className="result-card__open"
        type="button"
        aria-label={`Open ${name}`}
        onClick={onOpen}
      />
      {children}
    </article>
  )
}
