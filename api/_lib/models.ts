// No imports: the server, the eval page and scripts/build-catalogue.ts all read it.

export interface Prices {
  input: number
  cacheWrite: number
  cacheRead: number
  output: number
}

export interface ModelConfig {
  /** The model id, plus a variant when there is one: names the setup's recorded runs. */
  key: string
  model: string
  label: string
  thinking?: 'disabled'
  /** USD per million tokens, from https://platform.claude.com/docs/en/about-claude/pricing (2026-11-07). */
  prices: Prices
}

// Haiku 5.5's prices for prompts up to 100k tokens: the catalogue prompt is about 80k.
const HAIKU_5_5: Prices = {
  input: 0.1,
  cacheWrite: 0.125,
  cacheRead: 0.01,
  output: 0.5,
}

// First is the default. All of them take the same request, so none needs its own adapter.
export const MODEL_CONFIGS: readonly ModelConfig[] = [
  {
    key: 'claude-haiku-5-5',
    model: 'claude-haiku-5-5',
    label: 'Claude Haiku 5.5',
    prices: HAIKU_5_5,
  },
  {
    key: 'claude-haiku-5-5.no-thinking',
    model: 'claude-haiku-5-5',
    label: 'Claude Haiku 5.5, thinking off',
    thinking: 'disabled',
    prices: HAIKU_5_5,
  },
  {
    key: 'claude-haiku-4-5-20251001',
    model: 'claude-haiku-4-5-20251001',
    label: 'Claude Haiku 4.5',
    prices: { input: 1, cacheWrite: 1.25, cacheRead: 0.1, output: 5 },
  },
  {
    key: 'claude-sonnet-5-5',
    model: 'claude-sonnet-5-5',
    label: 'Claude Sonnet 5.5',
    prices: { input: 2, cacheWrite: 2.5, cacheRead: 0.1, output: 10 },
  },
]

export const DEFAULT_CONFIG = MODEL_CONFIGS[0]

export function configByKey(key: string): ModelConfig | undefined {
  return MODEL_CONFIGS.find((config) => config.key === key)
}

export function configOf(
  model: string,
  thinking: string | undefined,
): ModelConfig | undefined {
  return MODEL_CONFIGS.find(
    (config) => config.model === model && config.thinking === thinking,
  )
}

/** The model's prices; an unlisted model is costed at the default's, so check its rate card. */
export function pricesOf(model: string): Prices {
  return (
    MODEL_CONFIGS.find((config) => config.model === model)?.prices ??
    DEFAULT_CONFIG.prices
  )
}
