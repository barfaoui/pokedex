import { expect, test } from 'vitest'
import { snapshotFor } from '@/eval/llm-snapshot'

test('a recorded prompt v1 run, with a note per result, still loads as keys', () => {
  const v1 = snapshotFor('claude-haiku-5-5', 1)
  expect(v1?.promptVersion).toBe('ask-ai-1')
  expect(v1?.cases.find((c) => c.query === 'bulba')?.results[0]).toBe(
    'pokemon:bulbasaur',
  )
})
