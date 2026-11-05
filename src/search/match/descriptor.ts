import { closeScore } from '../typo'
import type { Descriptor } from '../types/query'
import { DESCRIPTORS } from '../vocabulary'

export function matchDescriptor(
  word: string,
): { value: Descriptor; score: number } | undefined {
  let best: { value: Descriptor; score: number } | undefined
  for (const [name, value] of DESCRIPTORS) {
    const score = closeScore(word, name)
    if (score > (best?.score ?? 0)) {
      best = { value, score }
    }
  }
  return best
}
