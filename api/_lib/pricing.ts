// Prices and cost estimates for Ask AI. No catalogue and no key here: the eval page imports this.
import { CATALOGUE_CHARACTERS } from './catalogue-size.js'

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

// About 4 characters per token. The prompt around the catalogue and the answer are rough sizes.
const CHARACTERS_PER_TOKEN = 4
const PROMPT_TOKENS = 450
const ANSWER_TOKENS = 350

/** A rough cost for `queries` calls: the catalogue is written to the cache once, then read. */
export function estimateRunCostUsd(queries: number): number {
  if (queries <= 0) {
    return 0
  }
  const catalogueTokens = Math.ceil(CATALOGUE_CHARACTERS / CHARACTERS_PER_TOKEN)
  const call = (cacheWriteTokens: number, cacheReadTokens: number) =>
    costUsd({
      inputTokens: PROMPT_TOKENS,
      cacheWriteTokens,
      cacheReadTokens,
      outputTokens: ANSWER_TOKENS,
    })
  return call(catalogueTokens, 0) + (queries - 1) * call(0, catalogueTokens)
}
