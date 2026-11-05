import { COLORS, HABITATS, SHAPES } from '../data/types/model'
import { CONCEPTS } from './concepts/seed'
import type { ConceptId } from './concepts/types'
import { normalize } from '../text/normalize'
import type {
  Comparison,
  ConditionStat,
  Descriptor,
  FamilyDirection,
  Sort,
} from './types/query'
import type { ResultKind } from './types/result'

export const STAT_WORDS = new Map<string, ConditionStat>([
  ['hp', 'hp'],
  ['attack', 'attack'],
  ['defense', 'defense'],
  ['special attack', 'special-attack'],
  ['special defense', 'special-defense'],
  ['speed', 'speed'],
  ['total', 'total'],
  ['weight', 'weight'],
  ['height', 'height'],
])

type Measure = Extract<ConditionStat, 'weight' | 'height'>

/** The stat they compare is in the word: "heavier than 200 kg". */
export const COMPARATIVE_WORDS = new Map<
  string,
  { stat: Measure; comparison: Comparison }
>([
  ['heavier than', { stat: 'weight', comparison: 'over' }],
  ['lighter than', { stat: 'weight', comparison: 'under' }],
  ['taller than', { stat: 'height', comparison: 'over' }],
  ['shorter than', { stat: 'height', comparison: 'under' }],
])

/** Into the data's units, kg and m. */
export const UNITS = new Map<string, { stat: Measure; factor: number }>([
  ...['kg', 'kgs', 'kilo', 'kilos', 'kilogram', 'kilograms'].map(
    (unit) => [unit, { stat: 'weight', factor: 1 }] as const,
  ),
  ...['lb', 'lbs', 'pound', 'pounds'].map(
    (unit) => [unit, { stat: 'weight', factor: 0.4536 }] as const,
  ),
  ...['m', 'meter', 'meters', 'metre', 'metres'].map(
    (unit) => [unit, { stat: 'height', factor: 1 }] as const,
  ),
  ...['cm', 'centimeter', 'centimeters', 'centimetre', 'centimetres'].map(
    (unit) => [unit, { stat: 'height', factor: 0.01 }] as const,
  ),
  ...['ft', 'foot', 'feet'].map(
    (unit) => [unit, { stat: 'height', factor: 0.3048 }] as const,
  ),
])

export const SORT_WORDS = new Map<string, Omit<Sort, 'word'>>([
  ['fast', { attribute: 'speed', direction: 'desc' }],
  ['fastest', { attribute: 'speed', direction: 'desc' }],
  ['slow', { attribute: 'speed', direction: 'asc' }],
  ['slowest', { attribute: 'speed', direction: 'asc' }],
  ['strong', { attribute: 'attack', direction: 'desc' }],
  ['strongest', { attribute: 'total', direction: 'desc' }],
  ['weakest', { attribute: 'total', direction: 'asc' }],
  ['best', { attribute: 'total', direction: 'desc' }],
  ['heavy', { attribute: 'weight', direction: 'desc' }],
  ['heaviest', { attribute: 'weight', direction: 'desc' }],
  ['lightest', { attribute: 'weight', direction: 'asc' }],
  ['tall', { attribute: 'height', direction: 'desc' }],
  ['tallest', { attribute: 'height', direction: 'desc' }],
  ['shortest', { attribute: 'height', direction: 'asc' }],
  ['tanky', { attribute: 'hpAndDefense', direction: 'desc' }],
  ['tankiest', { attribute: 'hpAndDefense', direction: 'desc' }],
  ...(
    [
      ['high', 'desc'],
      ['highest', 'desc'],
      ['most', 'desc'],
      ['best', 'desc'],
      ['greatest', 'desc'],
      ['low', 'asc'],
      ['lowest', 'asc'],
      ['least', 'asc'],
      ['worst', 'asc'],
    ] as const
  ).flatMap(([qualifier, direction]) =>
    [...STAT_WORDS].map(
      ([stat, attribute]) =>
        [`${qualifier} ${stat}`, { attribute, direction }] as const,
    ),
  ),
])

// The parser rewrites >, <, >= and <= into these words before normalising.
export const COMPARISON_WORDS = new Map<string, Comparison>([
  ['over', 'over'],
  ['above', 'over'],
  ['more than', 'over'],
  ['greater than', 'over'],
  ['under', 'under'],
  ['below', 'under'],
  ['less than', 'under'],
  ['at least', 'atLeast'],
  ['atleast', 'atLeast'],
  ['at most', 'atMost'],
  ['atmost', 'atMost'],
])

export const DESCRIPTORS = new Map<string, Descriptor>([
  ...COLORS.map(
    (value) => [normalize(value), { field: 'color', value }] as const,
  ),
  ...SHAPES.map(
    (value) => [normalize(value), { field: 'shape', value }] as const,
  ),
  ...HABITATS.map(
    (value) => [normalize(value), { field: 'habitat', value }] as const,
  ),
])

// The roots too: "pokemon that paralyzes" says "paralyzes", not "paralyze". A query is read word
// by word, so two-word roots ("rain dance") can't match here.
export const CONCEPT_WORDS = new Map<string, ConceptId>(
  CONCEPTS.flatMap((concept) =>
    [...concept.words, ...concept.roots]
      .filter((word) => !word.includes(' '))
      .map((word) => [word, concept.id] as const),
  ),
)

// Names the kind of result wanted. It ranks that kind first, it doesn't filter: the others stay below.
export const KIND_WORDS = new Map<string, ResultKind>([
  ['pokemon', 'pokemon'],
  ['pokemons', 'pokemon'],
  // "who can learn surf" asks for a Pokémon
  ['who', 'pokemon'],
  ['move', 'move'],
  ['moves', 'move'],
  ['ability', 'ability'],
  ['abilities', 'ability'],
])

export const ABILITY_HINT = 'can'
export const FAMILY_WORDS = new Set([
  'evolution',
  'evolutions',
  'evolve',
  'evolves',
])

/** Only with a family word: "pre evolution", "final evolution". */
export const FAMILY_DIRECTION_WORDS = new Map<string, FamilyDirection>([
  ['pre', 'earlier'],
  ['previous', 'earlier'],
  ['final', 'last'],
  ['last', 'last'],
])
/** "evolves into X" asks for what comes before X; "X evolves into" for what comes after. */
export const FAMILY_INTO_WORD = 'into'

/** Ask for the Pokémon that learn a move named in the query; they imply Pokémon. */
export const LEARN_WORDS = new Set([
  'learn',
  'learns',
  'learned',
  'learnt',
  'know',
  'knows',
])
/** The same with "pokemon" in the query ("which pokemon have levitate"), for abilities too. */
export const HAVE_WORDS = new Set(['have', 'has', 'with'])

/** The data's own flags: "legendary" means is_legendary, not the word in a category. */
export const RARITY_WORDS = new Map<string, 'legendary' | 'mythical'>([
  ['legendary', 'legendary'],
  ['legendaries', 'legendary'],
  ['mythical', 'mythical'],
  ['mythic', 'mythical'],
  ['mythicals', 'mythical'],
])

export const NEGATING_WORDS = new Set(['not', 'no', 'without', 'except'])
export const SEGMENT_END_WORD = 'and'

export const NEGATION_WORDS = new Set([
  'prevent',
  'prevents',
  'stop',
  'stops',
  'avoid',
  'avoids',
  'immune',
  'immunity',
  'cure',
  'cures',
  'block',
  'blocks',
  'protect',
  'protects',
  'resist',
  'resists',
  'not',
  'no',
  'without',
])

// Dropped from a query unless it is made only of them ("put my opponent to sleep").
export const FILLER_WORDS = new Set([
  'a',
  'an',
  'the',
  'my',
  'your',
  'its',
  'their',
  'to',
  'put',
  'puts',
  'make',
  'makes',
  'get',
  'gets',
  'give',
  'gives',
  'opponent',
  'opponents',
  'enemy',
  'enemies',
  'foe',
  'foes',
  'target',
  'it',
  'them',
  'that',
  'which',
  // Question words only make a question: "what" leaves the kind to the noun after it
  'what',
  'is',
  'are',
  'does',
  'do',
  'did',
  'with',
  'can',
  'want',
  'i',
  'of',
  'show',
  'me',
  'find',
  'something',
  'and',
  'but',
  'team',
  'teams',
])
