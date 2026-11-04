import { Chip } from '../Chip/Chip'
import './ExampleQueries.scss'

const EXAMPLE_QUERIES = [
  'bulba',
  'fast electric',
  'put my opponent to sleep',
  'rain team',
  'green',
]

interface ExampleQueriesProps {
  onPick: (query: string) => void
}

export function ExampleQueries({ onPick }: ExampleQueriesProps) {
  return (
    <ul className="example-queries" aria-label="Example searches">
      {EXAMPLE_QUERIES.map((query) => (
        <li className="example-queries__item" key={query}>
          <Chip label={query} onClick={() => onPick(query)} />
        </li>
      ))}
    </ul>
  )
}
