import type { Direction } from './concepts/types'

// When the manual search is confident enough to skip semantic search.
// Set with the PRD queries: "pikachoo" (0.71) is the weakest answer that must count as confident.
export const CONFIDENT_SCORE = 0.7

// Names: the start of a name scores above a match anywhere in it, both higher the more of the
// name the word covers.
export const NAME_START_SCORE = 0.7
export const NAME_ANYWHERE_SCORE = 0.5
export const NAME_COVER_WEIGHT = 0.3
export const MIN_ANYWHERE_LENGTH = 3
// In a query of several words, "in" would otherwise find Insomnia.
export const MIN_SHORT_PREFIX_LENGTH = 3

// Typos and short forms, for names, types, colours, shapes and habitats.
export const TYPO_RATIO = 0.4
// "fight", "elec": a deliberate short form, just under the full word. Fewer than 4 letters
// would be too ambiguous ("gr": grass or ground).
export const MIN_PREFIX_LENGTH = 4
export const PREFIX_SCORE = 0.95

// A missed stat condition keeps a score for how close it was, unless the value is under half the threshold.
export const NEAR_MISS_WEIGHT = 0.95
export const MIN_NEAR_MISS_RATIO = 0.5

// Concepts are an interpretation of the query, so they never score 1.
export const CONCEPT_STATED = 0.85
// "Has a chance to…": the effect may not happen.
export const CONCEPT_CHANCE = 0.75
// Only passes on a status it received, so below a chance. Kept above CONFIDENT_SCORE: a query
// answered by it alone would otherwise sit on the edge of semantic search.
export const CONCEPT_COPIES = 0.72
// Weather keeps its order (starts, benefits, affected) under the same ceiling as a status.
export const WEATHER_SCORES: Partial<Record<Direction, number>> = {
  starts: 0.85,
  benefits: 0.8,
  affected: 0.75,
}
// A typed word in the name is literal evidence on top of the interpretation: Sleep Powder
// ranks above Hypnosis for "sleep".
export const CONCEPT_NAME_BONUS = 0.05
// A Pokémon is one step further from the query than the move or ability that relates it.
export const RELATED_WEIGHT = 0.9
// More related moves make a Pokémon a better fit, but never as good as its best move.
export const EXTRA_RELATED_BONUS = 0.02
export const MAX_EXTRA_RELATED = 3
export const BELOW_BEST_RELATED = 0.01

// Pokémon listed by a lone sort word without matching it: below any name match.
export const LISTED_SCORE = 0.1
// The kinds a query doesn't ask for stay visible, below the asked kind: for "pokemon that
// paralyzes", Thunder Wave (0.85) drops to 0.6, under Pikachu (0.82).
export const OTHER_KIND_WEIGHT = 0.7
// A family member is related to what was asked, not what was asked: well below the Pokémon
// itself, unless the family is what was asked ("evolution of charmander").
export const FAMILY_WEIGHT = 0.6
export const ASKED_FAMILY_WEIGHT = 1

// Semantic search. Set with the real model (tests/semantic.test.ts): the sleep moves for "make
// the enemy doze off" reach a cosine of about 0.51, while noise stays at 0.30 or below.
export const COSINE_FLOOR = 0.3
export const COSINE_CEILING = 0.7
// Meaning alone is never an exact match.
export const SEMANTIC_TOP_SCORE = 0.95
/** 0–1, after rescaling: cosine 0.40. */
export const SEMANTIC_THRESHOLD = 0.24
// Descriptions rank below the moves and abilities that do what was asked.
export const DESCRIPTION_WEIGHT = 0.85
export const SEMANTIC_MAX_RESULTS = 12
