import { COLORS, HABITATS, SHAPES } from '../data/types/model'
import { normalize } from './normalize'
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
