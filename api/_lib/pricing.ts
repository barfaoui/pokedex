// Prices and cost estimates for Ask AI. No catalogue and no key here: the eval page imports this.
import { CACHED_PROMPT_TOKENS } from './catalogue-size.js'

// USD per million tokens, for Claude Haiku 5.5. Check them on https://www.anthropic.com/pricing
// before trusting a cost: they are not read from the API.
export const PRICES_PER_MILLION = {
  input: 0.1,
  cacheWrite: 0.125,
  cacheRead: 0.01,
  output: 0.5,
}
// The eval counts in euros. Check the rate before trusting a converted cost.
export const USD_TO_EUR = 0.92

export interface TokenCounts {
  inputTokens: number
  cacheReadTokens: number
  cacheWriteTokens: number
  outputTokens: number
}

export function costUsd(tokens: TokenCounts): number {
  return (
    (tokens.inputTokens * PRICES_PER_MILLION.input +
      tokens.cacheWriteTokens * PRICES_PER_MILLION.cacheWrite +
      tokens.cacheReadTokens * PRICES_PER_MILLION.cacheRead +
      tokens.outputTokens * PRICES_PER_MILLION.output) /
    1_000_000
  )
}

// The query in its tags (18 tokens on average in the recorded v1 run), and a keys-only answer of
// about ten keys: an estimate until a v2 run is recorded.
const QUERY_TOKENS = 20
const ANSWER_TOKENS = 100

/** A rough cost for `queries` calls: the prompt and catalogue are written to the cache once, then read. */
export function estimateRunCostUsd(queries: number): number {
  if (queries <= 0) {
    return 0
  }
  const call = (cacheWriteTokens: number, cacheReadTokens: number) =>
    costUsd({
      inputTokens: QUERY_TOKENS,
      cacheWriteTokens,
      cacheReadTokens,
      outputTokens: ANSWER_TOKENS,
    })
  return (
    call(CACHED_PROMPT_TOKENS, 0) +
    (queries - 1) * call(0, CACHED_PROMPT_TOKENS)
  )
}
