/**
 * The models the LLM engine can be run with, first is the default. Adding one: its id here, and its
 * prices in api/_lib/pricing.ts if they differ from Haiku's (costs are computed with those).
 */
export const LLM_MODELS: readonly string[] = ['claude-haiku-5-5']

export const DEFAULT_LLM_MODEL = LLM_MODELS[0]
