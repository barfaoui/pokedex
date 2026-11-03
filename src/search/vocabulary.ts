import { COLORS, HABITATS, SHAPES } from '../data/types/model'
import { CONCEPTS } from './concepts/seed'
import type { ConceptId } from './concepts/types'
import { normalize } from '../text/normalize'
import type { Comparison, Descriptor, Sort, StatCriterion } from './types/query'

export const SORT_WORDS = new Map<string, Omit<Sort, 'word'>>([
  ['fast', { attribute: 'speed', direction: 'desc' }],
  ['slow', { attribute: 'speed', direction: 'asc' }],
  ['strong', { attribute: 'attack', direction: 'desc' }],
  ['strongest', { attribute: 'total', direction: 'desc' }],
  ['best', { attribute: 'total', direction: 'desc' }],
  ['heavy', { attribute: 'weight', direction: 'desc' }],
  ['tall', { attribute: 'height', direction: 'desc' }],
  ['tanky', { attribute: 'hpAndDefense', direction: 'desc' }],
])

export const STAT_WORDS = new Map<string, StatCriterion>([
  ['hp', 'hp'],
  ['attack', 'attack'],
  ['defense', 'defense'],
  ['special attack', 'special-attack'],
  ['special defense', 'special-defense'],
  ['speed', 'speed'],
  ['total', 'total'],
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

export const CONCEPT_WORDS = new Map<string, ConceptId>(
  CONCEPTS.flatMap((concept) =>
    concept.words.map((word) => [word, concept.id] as const),
  ),
)

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
  // "team" doesn't filter: grouping results stays in the UI.
  'team',
  'teams',
])
