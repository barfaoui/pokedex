import { AskAiIcon } from '../AskAiIcon/AskAiIcon'
import { assistantLine } from '../assistant-line'
import type { AiState } from '../useAskAi'
import './AssistantLine.scss'

interface AssistantLineProps {
  state: AiState
  shown: number
}

/** Plain text only: the AI's words never go through HTML. */
export function AssistantLine({ state, shown }: AssistantLineProps) {
  return (
    <p
      className="assistant-line"
      role={state.status === 'failed' ? 'alert' : 'status'}
    >
      <AskAiIcon className="assistant-line__icon" />
      {assistantLine(state, shown)}
    </p>
  )
}
