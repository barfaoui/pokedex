import { dataset } from '@/data/dataset'
import type { ResultKind } from '@/search/types/result'

export type Group = 'prd' | 'probe-tuning' | 'probe-holdout'

/** `kind:name`: a name alone is ambiguous (Thunder, Sing…). */
export type Key = `${ResultKind}:${string}`

export type Expectation =
  | { type: 'nothing' }
  | { type: 'first'; key: Key }
  | { type: 'ordered'; keys: Key[] }
  | {
      type: 'includes'
      keys: Key[]
      /** Results of this scope that aren't expected count as false positives. */
      exhaustive?: ResultKind | 'all'
      /** Item names that must never appear, as a result or as what matched. */
      forbidden?: string[]
      /** The kind named by the query ("pokemon that…"), which must come first. */
      kindFirst?: ResultKind
    }

export interface EvalQuery {
  query: string
  group: Group
  expect: Expectation
  /** Why this query can't count as unseen: it was used to set a threshold. */
  seen?: string
}

// Queries that failed when people tried the app, fixed since: they shaped the fix.
const USER_TESTING = 'from user testing'

const SLEEP_MOVES: Key[] = [
  'move:sing',
  'move:sleep-powder',
  'move:hypnosis',
  'move:lovely-kiss',
  'move:spore',
]
const SLEEP_OPPOSITES = ['insomnia', 'vital-spirit', 'rest']
const RAIN_ABILITIES = ['swift-swim', 'rain-dish', 'hydration', 'dry-skin']
const RAIN_MOVES = ['thunder', 'solar-beam']
const RAIN_POKEMON: Key[] = dataset.pokemon
  .filter((p) => p.abilities.some((a) => RAIN_ABILITIES.includes(a)))
  .map((p) => `pokemon:${p.name}` as const)

const prd: EvalQuery[] = [
  {
    query: 'bulba',
    group: 'prd',
    expect: { type: 'first', key: 'pokemon:bulbasaur' },
  },
  {
    query: 'pikachoo',
    group: 'prd',
    expect: { type: 'first', key: 'pokemon:pikachu' },
    seen: 'its score (0.71) set the 0.7 trigger',
  },
  {
    query: 'saur',
    group: 'prd',
    expect: {
      type: 'includes',
      keys: ['pokemon:bulbasaur', 'pokemon:ivysaur', 'pokemon:venusaur'],
      exhaustive: 'all',
    },
  },
  {
    query: 'fast electric',
    group: 'prd',
    expect: {
      type: 'ordered',
      keys: ['pokemon:electrode', 'pokemon:jolteon', 'pokemon:raichu'],
    },
  },
  {
    query: 'green',
    group: 'prd',
    expect: {
      type: 'includes',
      keys: [
        'pokemon:bulbasaur',
        'pokemon:ivysaur',
        'pokemon:venusaur',
        'pokemon:caterpie',
        'pokemon:metapod',
        'pokemon:bellsprout',
        'pokemon:weepinbell',
        'pokemon:victreebel',
        'pokemon:scyther',
      ],
      exhaustive: 'pokemon',
    },
  },
  {
    query: 'put my opponent to sleep',
    group: 'prd',
    expect: {
      type: 'includes',
      keys: [...SLEEP_MOVES, 'ability:effect-spore'],
      forbidden: SLEEP_OPPOSITES,
    },
  },
  {
    query: 'rain team',
    group: 'prd',
    expect: {
      type: 'includes',
      keys: [
        ...RAIN_ABILITIES.map((name) => `ability:${name}` as const),
        ...RAIN_MOVES.map((name) => `move:${name}` as const),
        ...RAIN_POKEMON,
      ],
    },
  },
  {
    query: 'sun team',
    group: 'prd',
    expect: {
      type: 'includes',
      keys: [
        'ability:drought',
        'ability:chlorophyll',
        'ability:solar-power',
        'move:growth',
        'move:solar-beam',
        'move:thunder',
      ],
      forbidden: ['mirror-move'],
    },
  },
  {
    query: 'drain',
    group: 'prd',
    expect: {
      type: 'includes',
      keys: [],
      forbidden: [...RAIN_ABILITIES, ...RAIN_MOVES],
    },
  },
  {
    query: 'trainer',
    group: 'prd',
    expect: {
      type: 'includes',
      keys: [],
      forbidden: [...RAIN_ABILITIES, ...RAIN_MOVES],
    },
  },
  {
    query: 'spaghetti',
    group: 'prd',
    expect: { type: 'nothing' },
    seen: 'used to set the cosine floor',
  },
]

// May guide a threshold change: if one does, say which query in the commit.
const probeTuning: EvalQuery[] = [
  {
    query: 'make it fall asleep',
    group: 'probe-tuning',
    expect: { type: 'includes', keys: SLEEP_MOVES, forbidden: SLEEP_OPPOSITES },
  },
  {
    query: 'make the enemy doze off',
    group: 'probe-tuning',
    expect: { type: 'includes', keys: SLEEP_MOVES, forbidden: SLEEP_OPPOSITES },
    seen: 'used to pick the model and set the cosine floor',
  },
  {
    query: 'paralyze the enemy',
    group: 'probe-tuning',
    expect: {
      type: 'includes',
      keys: ['move:thunder-wave', 'move:stun-spore', 'move:glare'],
    },
  },
  {
    query: 'heal in the rain',
    group: 'probe-tuning',
    expect: { type: 'includes', keys: ['ability:rain-dish'] },
  },
  {
    query: 'pokemon that burns',
    group: 'probe-tuning',
    expect: {
      type: 'includes',
      keys: [
        'pokemon:charmander',
        'pokemon:vulpix',
        'pokemon:growlithe',
        'pokemon:ponyta',
        'pokemon:magmar',
      ],
      kindFirst: 'pokemon',
    },
    seen: 'used to design the kind words',
  },
  {
    query: 'pokemon that paralyzes the enemy',
    group: 'probe-tuning',
    expect: {
      type: 'includes',
      keys: [
        'pokemon:pikachu',
        'pokemon:raichu',
        'pokemon:electabuzz',
        'pokemon:magnemite',
        'pokemon:voltorb',
        'pokemon:jolteon',
        'pokemon:zapdos',
      ],
      kindFirst: 'pokemon',
    },
    seen: 'used to design the kind words',
  },
  {
    query: 'the fastest pokemon',
    group: 'probe-tuning',
    expect: { type: 'first', key: 'pokemon:electrode' },
    seen: USER_TESTING,
  },
  {
    query: 'fight',
    group: 'probe-tuning',
    expect: {
      type: 'includes',
      keys: [
        'pokemon:mankey',
        'pokemon:primeape',
        'pokemon:poliwrath',
        'pokemon:machop',
        'pokemon:machoke',
        'pokemon:machamp',
        'pokemon:hitmonlee',
        'pokemon:hitmonchan',
      ],
    },
    seen: USER_TESTING,
  },
  {
    query: 'elec',
    group: 'probe-tuning',
    expect: {
      type: 'includes',
      keys: ['pokemon:pikachu', 'pokemon:raichu', 'pokemon:jolteon'],
    },
    seen: USER_TESTING,
  },
  {
    query: 'show me the fastest pokemon',
    group: 'probe-tuning',
    expect: { type: 'first', key: 'pokemon:electrode' },
    seen: USER_TESTING,
  },
  {
    query: 'evolution of charmander',
    group: 'probe-tuning',
    expect: {
      type: 'includes',
      keys: ['pokemon:charmander', 'pokemon:charmeleon', 'pokemon:charizard'],
    },
    seen: USER_TESTING,
  },
  {
    query: 'blaaastoiise',
    group: 'probe-tuning',
    expect: { type: 'first', key: 'pokemon:blastoise' },
    seen: USER_TESTING,
  },
  {
    query: '3',
    group: 'probe-tuning',
    expect: { type: 'first', key: 'pokemon:venusaur' },
    seen: USER_TESTING,
  },
  { query: 'pizza', group: 'probe-tuning', expect: { type: 'nothing' } },
  { query: 'hello', group: 'probe-tuning', expect: { type: 'nothing' } },
  { query: 'best car', group: 'probe-tuning', expect: { type: 'nothing' } },
  {
    query: 'weather in Paris',
    group: 'probe-tuning',
    expect: { type: 'nothing' },
  },
]

// Never used to tune anything, so their numbers stay an honest estimate. Once one is used to
// change a threshold, move it to the tuning probes and write a new held-out query instead.
const probeHoldout: EvalQuery[] = [
  {
    query: 'restore my HP',
    group: 'probe-holdout',
    expect: {
      type: 'includes',
      keys: ['move:recover', 'move:soft-boiled'],
    },
  },
  {
    query: 'set the foe on fire',
    group: 'probe-holdout',
    expect: {
      type: 'includes',
      keys: ['move:ember', 'move:flamethrower', 'move:fire-blast'],
    },
  },
  {
    query: 'make the opponent confused',
    group: 'probe-holdout',
    expect: {
      type: 'includes',
      keys: ['move:supersonic', 'move:confuse-ray'],
    },
  },
  {
    query: 'mutate',
    group: 'probe-holdout',
    expect: { type: 'includes', keys: ['pokemon:eevee'] },
  },
  {
    query: 'stock market',
    group: 'probe-holdout',
    expect: { type: 'nothing' },
  },
  { query: 'my homework', group: 'probe-holdout', expect: { type: 'nothing' } },
  {
    query: 'football scores',
    group: 'probe-holdout',
    expect: { type: 'nothing' },
  },
]

export const QUERIES: EvalQuery[] = [...prd, ...probeTuning, ...probeHoldout]
