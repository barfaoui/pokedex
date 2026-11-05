import { useState, type FormEvent } from 'react'
import type { AvailableEngine } from '@/eval/engines/engines'
import { ms } from '@/eval/format'
import type { SearchResult } from '@/search/types/result'
import { RankedList } from '../RankedList/RankedList'
import './LiveSearch.scss'

interface LiveSearchProps {
  engines: AvailableEngine[]
}

interface Answer {
  engine: AvailableEngine
  results: SearchResult[]
  ms: number
}

export function LiveSearch({ engines }: LiveSearchProps) {
  const [query, setQuery] = useState('')
  const [asked, setAsked] = useState('')
  const [answers, setAnswers] = useState<Answer[]>([])

  async function submit(event: FormEvent) {
    event.preventDefault()
    const next: Answer[] = []
    for (const engine of engines) {
      const start = performance.now()
      const results = await engine.search(query)
      next.push({ engine, results, ms: performance.now() - start })
    }
    setAsked(query)
    setAnswers(next)
  }

  return (
    <section className="live-search" aria-label="Run one query">
      <form className="live-search__form" onSubmit={submit}>
        <label className="live-search__label">
          One query, live
          <input
            className="live-search__input"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <button
          className="live-search__submit"
          type="submit"
          disabled={!engines.length}
        >
          Search
        </button>
      </form>
      {answers.length > 0 && (
        <div className="live-search__answers">
          {answers.map((answer) => (
            <div key={answer.engine.id} className="live-search__answer">
              <h2 className="live-search__engine">
                {answer.engine.name} · {ms(answer.ms)}
              </h2>
              <RankedList results={answer.results} query={asked} />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
