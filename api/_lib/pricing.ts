// No catalogue and no key here: the eval page imports this.
import { CACHED_PROMPT_TOKENS } from './catalogue-size.js'
import { pricesOf } from './models.js'

// The eval counts in euros. Check the rate before trusting a converted cost.
export const USD_TO_EUR = 0.92

export interface TokenCounts {
  inputTokens: number
  cacheReadTokens: number
  cacheWriteTokens: number
  outputTokens: number
}

export function costUsd(tokens: TokenCounts, model: string): number {
  const prices = pricesOf(model)
  return (
    (tokens.inputTokens * prices.input +
      tokens.cacheWriteTokens * prices.cacheWrite +
      tokens.cacheReadTokens * prices.cacheRead +
      tokens.outputTokens * prices.output) /
    1_000_000
  )
}

// The query in its tags (18 tokens on average in the recorded v1 run), and a keys-only answer of
// about ten keys. A model that thinks writes more: the estimate is low for it.
const QUERY_TOKENS = 20
const ANSWER_TOKENS = 100

// Assumes the prompt is written to the cache once, then read.
export function estimateRunCostUsd(queries: number, model: string): number {
  if (queries <= 0) {
    return 0
  }
  // Each tokenizer counts the same prompt differently; an unlisted model gets the largest count.
  const promptTokens =
    CACHED_PROMPT_TOKENS[model] ??
    Math.max(...Object.values(CACHED_PROMPT_TOKENS))
  const call = (cacheWriteTokens: number, cacheReadTokens: number) =>
    costUsd(
      {
        inputTokens: QUERY_TOKENS,
        cacheWriteTokens,
        cacheReadTokens,
        outputTokens: ANSWER_TOKENS,
      },
      model,
    )
  return call(promptTokens, 0) + (queries - 1) * call(0, promptTokens)
}
