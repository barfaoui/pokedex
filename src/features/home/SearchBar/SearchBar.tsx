import { useRef, type KeyboardEvent } from 'react'
import { PixelArt } from '@/shared/PixelArt/PixelArt'
import './SearchBar.scss'

const CROSS = [
  '##....##',
  '###..###',
  '.######.',
  '..####..',
  '..####..',
  '.######.',
  '###..###',
  '##....##',
]

const CROSS_PIXELS = { '#': 'search-bar__clear-pixel' }

interface SearchBarProps {
  query: string
  onQueryChange: (query: string) => void
}

export function SearchBar({ query, onQueryChange }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      onQueryChange('')
    }
  }

  function handleClear() {
    onQueryChange('')
    inputRef.current?.focus()
  }

  return (
    <div className="search-bar" role="search">
      <input
        ref={inputRef}
        className="search-bar__input"
        type="search"
        aria-label="Search"
        placeholder="I'm looking for…"
        autoComplete="off"
        spellCheck={false}
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        onKeyDown={handleKeyDown}
      />
      {query && (
        <button
          className="search-bar__clear-button"
          type="button"
          aria-label="Clear search"
          onClick={handleClear}
        >
          <PixelArt
            className="search-bar__clear-icon"
            rows={CROSS}
            pixelClasses={CROSS_PIXELS}
          />
        </button>
      )}
    </div>
  )
}
