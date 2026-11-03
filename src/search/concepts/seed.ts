import type { Concept, ConceptId } from './types.ts'

const SEED: Record<ConceptId, Omit<Concept, 'id'>> = {
  sleep: {
    group: 'statusCondition',
    roots: ['sleep', 'asleep', 'sleeping', 'sleeps'],
    words: [
      'sleep',
      'asleep',
      'sleeping',
      'sleepy',
      'doze',
      'nap',
      'slumber',
      'drowsy',
    ],
  },
  paralysis: {
    group: 'statusCondition',
    roots: ['paralyze', 'paralyzes', 'paralyzed', 'paralyzing', 'paralysis'],
    words: [
      'paralyze',
      'paralyzed',
      'paralysis',
      'paralyse',
      'paralysed',
      'numb',
    ],
  },
  poison: {
    group: 'statusCondition',
    roots: ['poison', 'poisons', 'poisoned', 'poisoning'],
    words: ['poison', 'poisoned', 'poisoning', 'poisonous', 'venom'],
  },
  burn: {
    group: 'statusCondition',
    roots: ['burn', 'burns', 'burned', 'burning'],
    words: ['burn', 'burned', 'burnt', 'burning', 'scorch'],
  },
  freeze: {
    group: 'statusCondition',
    roots: ['freeze', 'freezes', 'frozen', 'freezing'],
    words: ['freeze', 'frozen', 'froze', 'freezing'],
  },
  confusion: {
    group: 'statusCondition',
    roots: ['confuse', 'confuses', 'confused', 'confusion'],
    words: ['confuse', 'confused', 'confusion', 'confusing', 'dizzy'],
  },
  flinch: {
    group: 'statusCondition',
    roots: ['flinch', 'flinches', 'flinching'],
    words: ['flinch', 'flinching'],
  },
  rain: {
    group: 'weather',
    // Weather mostly appears as the move that starts it: "During Rain Dance, …"
    roots: ['rain', 'rain dance'],
    words: ['rain', 'rainy', 'raining'],
  },
  sun: {
    group: 'weather',
    roots: ['sunlight', 'sunny day'],
    words: ['sun', 'sunny', 'sunlight', 'sunshine'],
  },
  sandstorm: {
    group: 'weather',
    roots: ['sandstorm'],
    words: ['sandstorm', 'sand'],
  },
  hail: {
    group: 'weather',
    roots: ['hail'],
    words: ['hail', 'snow'],
  },
}

export const CONCEPT_BY_ID = Object.fromEntries(
  Object.entries(SEED).map(([id, concept]) => [id, { id, ...concept }]),
) as Record<ConceptId, Concept>

export const CONCEPTS: Concept[] = Object.values(CONCEPT_BY_ID)
