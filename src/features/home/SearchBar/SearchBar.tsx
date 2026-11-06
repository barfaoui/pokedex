import { useId, useRef, type KeyboardEvent } from 'react'
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

// 🔍 with gold sparkles above it: search, with AI.
const ASK_AI = [
  '...S.......S..',
  '..SSS.....SSS.',
  '...S.......S..',
  '....FFFF......',
  '..FFFFFFFF....',
  '..FFGWGGFF....',
  '.FFGWGGGGFF...',
  '.FFGGGGGGFF...',
  '.FFGGGGGGFF...',
  '..FFGGGGFF....',
  '..FFFFFFFFH...',
  '....FFFF.HHH..',
  '..........HHH.',
  '...........HHH',
]

const ASK_AI_PIXELS = {
  S: 'search-bar__ask-ai-sparkle',
  F: 'search-bar__ask-ai-frame',
  G: 'search-bar__ask-ai-glass',
  W: 'search-bar__ask-ai-glint',
  H: 'search-bar__ask-ai-handle',
}

const AI_NOTICE = 'Ask AI: sends your query to an AI provider (Anthropic)'

interface SearchBarProps {
  query: string
  onQueryChange: (query: string) => void
  /** Left out when the server has no AI key: the button isn't shown at all. */
  onAskAi?: () => void
  askingAi?: boolean
}

export function SearchBar({
  query,
  onQueryChange,
  onAskAi,
  askingAi = false,
}: SearchBarProps) {
  const noteId = useId()
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
    <div
      className="search-bar"
      role="search"
      data-ask-ai={onAskAi && query.trim() ? 'true' : undefined}
    >
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
      {onAskAi && query.trim() && (
        <>
          <button
            className="search-bar__ask-ai"
            type="button"
            aria-label="Ask AI"
            aria-describedby={noteId}
            title={AI_NOTICE}
            disabled={askingAi}
            onClick={onAskAi}
          >
            <PixelArt
              className="search-bar__ask-ai-icon"
              rows={ASK_AI}
              pixelClasses={ASK_AI_PIXELS}
            />
          </button>
          <span className="search-bar__ask-ai-note" id={noteId}>
            {AI_NOTICE}
          </span>
        </>
      )}
    </div>
  )
}
