import type { ReactNode } from 'react'
import './ResultCard.scss'

export interface CardSelection {
  selected: boolean
  onToggle: () => void
}

interface ResultCardProps {
  nameId: string
  name: string
  score: number
  onOpen: () => void
  selection?: CardSelection
  children: ReactNode
}

// The open button covers the whole card; other buttons sit above it.
export function ResultCard({
  nameId,
  name,
  score,
  onOpen,
  selection,
  children,
}: ResultCardProps) {
  const isExact = score === 1

  return (
    <article
      className="result-card"
      aria-labelledby={nameId}
      data-exact={isExact}
      data-selected={selection?.selected ?? false}
    >
      {isExact && <span className="result-card__exact">Exact match</span>}
      {selection ? (
        <button
          className="result-card__open"
          type="button"
          role="checkbox"
          aria-checked={selection.selected}
          aria-label={`Select ${name}`}
          onClick={selection.onToggle}
        />
      ) : (
        <button
          className="result-card__open"
          type="button"
          aria-label={`Open ${name}`}
          onClick={onOpen}
        />
      )}
      {children}
    </article>
  )
}
