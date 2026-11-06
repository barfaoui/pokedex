import type { AiState } from '../useAskAi'
import './AiNote.scss'

interface AiNoteProps {
  state: AiState
  /** How many AI results are shown: none means the normal results stayed. */
  shown: number
}

/** Plain text only: the AI's words never go through HTML. */
export function AiNote({ state, shown }: AiNoteProps) {
  return (
    <p
      className="ai-note"
      role={state.status === 'failed' ? 'alert' : 'status'}
      data-status={state.status}
    >
      {noteText(state, shown)}
    </p>
  )
}

function noteText(state: AiState, shown: number): string {
  switch (state.status) {
    case 'asking':
      return 'Prof. Chen is asking…'
    case 'failed':
      return `${state.message}. The results below are the usual search.`
    case 'done':
      if (state.note) {
        return `${state.note}. The results below are the usual search.`
      }
      return shown
        ? 'AI answer: what an AI model picked from the Pokédex for this query.'
        : 'AI answer: nothing in the Pokédex fits. The results below are the usual search.'
  }
}
