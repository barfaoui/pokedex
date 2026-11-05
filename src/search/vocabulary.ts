import { COLORS, HABITATS, SHAPES } from '../data/types/model'
import { CONCEPTS } from './concepts/seed'
import type { ConceptId } from './concepts/types'
import { normalize } from '../text/normalize'
import type { Comparison, Descriptor, Sort, StatCriterion } from './types/query'
import type { ResultKind } from './types/result'

export const STAT_WORDS = new Map<string, StatCriterion>([
  ['hp', 'hp'],
  ['attack', 'attack'],
  ['defense', 'defense'],
  ['special attack', 'special-attack'],
  ['special defense', 'special-defense'],
  ['speed', 'speed'],
  ['total', 'total'],
])

// "high hp", "low speed", "most attack", "least special defense": a stat to sort by.
const STAT_SORT_QUALIFIERS = new Map<string, Sort['direction']>([
  ['high', 'desc'],
  ['most', 'desc'],
  ['low', 'asc'],
  ['least', 'asc'],
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
  ...[...STAT_SORT_QUALIFIERS].flatMap(([qualifier, direction]) =>
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
  ['move', 'move'],
  ['moves', 'move'],
  ['ability', 'ability'],
  ['abilities', 'ability'],
])

// "Something that can paralyze" asks for an ability, unless a kind is named ("pokemon that can…").
export const ABILITY_HINT = 'can'

// "electric not flying": what follows is removed from the results, up to "and" or the end.
// Only these two: "without" and "except" are a documented limit.
export const NEGATING_WORDS = new Set(['not', 'no'])
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
  'with',
  'can',
  'want',
  'i',
  'something',
  // Connect parts without meaning anything: "fire but not flying".
  'and',
  'but',
  // "team" doesn't filter: grouping results stays in the UI.
  'team',
  'teams',
])
