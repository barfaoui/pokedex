import { expect, test } from 'vitest'
import { modelLabel } from '@/eval/format'

test('a model id reads as its name, consecutive numbers as a version', () => {
  expect(modelLabel('claude-haiku-5-5')).toBe('Claude Haiku 5.5')
  expect(modelLabel('claude-3-5-haiku-20241022')).toBe(
    'Claude 3.5 Haiku 20241022',
  )
})
