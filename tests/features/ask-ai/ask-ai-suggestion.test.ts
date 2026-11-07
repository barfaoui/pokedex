import { describe, expect, it } from 'vitest'
import { suggestsAskAi } from '@/features/ask-ai/ask-ai-suggestion'
import { search } from '@/search/search'

const unsure = search('a cute pink pokemon that sings')
const sure = search('pikachu')
const ready = { available: true, settled: true, askedAi: false }

describe('suggestsAskAi', () => {
  it('suggests Ask AI when the search is not confident, nothing found included', () => {
    expect(suggestsAskAi({ ...ready, deterministic: unsure })).toBe(true)
    expect(suggestsAskAi({ ...ready, deterministic: [] })).toBe(true)
  })

  it('stays hidden when confident, without a key, while loading, and on AI results', () => {
    expect(suggestsAskAi({ ...ready, deterministic: sure })).toBe(false)
    expect(
      suggestsAskAi({ ...ready, available: false, deterministic: unsure }),
    ).toBe(false)
    expect(
      suggestsAskAi({ ...ready, settled: false, deterministic: unsure }),
    ).toBe(false)
    expect(
      suggestsAskAi({ ...ready, askedAi: true, deterministic: unsure }),
    ).toBe(false)
  })
})
