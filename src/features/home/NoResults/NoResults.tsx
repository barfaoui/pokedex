import { ExampleQueries } from '@/features/home/ExampleQueries/ExampleQueries'
import './NoResults.scss'

interface NoResultsProps {
  query: string
  onPick: (query: string) => void
}

export function NoResults({ query, onPick }: NoResultsProps) {
  return (
    <section className="no-results">
      <h2 className="no-results__message">
        Prof. Chen found nothing for “{query.trim()}”.
      </h2>
      <p className="no-results__hint">Try one of these:</p>
      <ExampleQueries onPick={onPick} />
    </section>
  )
}
