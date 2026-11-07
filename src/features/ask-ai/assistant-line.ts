import type { AiState } from './useAskAi'

export const ASSISTANT_FOUND = 'Prof. Chen’s assistant found these'
export const ASSISTANT_FOUND_NOTHING =
  'Prof. Chen’s assistant found nothing either'

/** `shown`: how many AI results replace the list; a failure leaves the usual search. */
export function assistantLine(state: AiState, shown: number): string {
  switch (state.status) {
    case 'asking':
      return 'Prof. Chen’s assistant is looking…'
    case 'failed':
      return `${state.message}. The results below are the usual search.`
    case 'done':
      if (state.note) {
        return `${state.note}. The results below are the usual search.`
      }
      return shown ? ASSISTANT_FOUND : ASSISTANT_FOUND_NOTHING
  }
}
