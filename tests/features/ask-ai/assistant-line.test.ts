import { describe, expect, it } from 'vitest'
import {
  ASSISTANT_FOUND,
  ASSISTANT_FOUND_NOTHING,
  assistantLine,
} from '@/features/ask-ai/assistant-line'
import { aiResults } from '@/features/ask-ai/ask-ai-client'
import type { AiState } from '@/features/ask-ai/useAskAi'
import { describeMatches } from '@/features/results/describe-match'

describe('assistantLine', () => {
  it('says the assistant found these, or found nothing either', () => {
    const done: AiState = { status: 'done', query: 'x', results: [] }
    expect(assistantLine(done, 3)).toBe(ASSISTANT_FOUND)
    expect(assistantLine(done, 0)).toBe(ASSISTANT_FOUND_NOTHING)
  })
})

describe('aiResults', () => {
  it('gives cards no "matched on" line', () => {
    const [pikachu] = aiResults(['pokemon:pikachu'])
    expect(describeMatches(pikachu.matched, 2).lines).toEqual([])
  })
})
