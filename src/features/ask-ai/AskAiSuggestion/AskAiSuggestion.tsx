import { useId } from 'react'
import { AI_NOTICE } from '../ask-ai-client'
import './AskAiSuggestion.scss'

interface AskAiSuggestionProps {
  onAsk: () => void
}

export function AskAiSuggestion({ onAsk }: AskAiSuggestionProps) {
  const noticeId = useId()
  return (
    <p className="ask-ai-suggestion">
      Not what you’re looking for?{' '}
      <button
        className="ask-ai-suggestion__button"
        type="button"
        aria-describedby={noticeId}
        title={AI_NOTICE}
        onClick={onAsk}
      >
        Let AI help you
      </button>
      <span className="ask-ai-suggestion__notice" id={noticeId}>
        {AI_NOTICE}
      </span>
    </p>
  )
}
