import type { Concept } from './types.ts'

export const CONCEPTS: Concept[] = [
  {
    id: 'sleep',
    group: 'status',
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
  {
    id: 'paralysis',
    group: 'status',
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
  {
    id: 'poison',
    group: 'status',
    roots: ['poison', 'poisons', 'poisoned', 'poisoning'],
    words: ['poison', 'poisoned', 'poisoning', 'poisonous', 'venom'],
  },
  {
    id: 'burn',
    group: 'status',
    roots: ['burn', 'burns', 'burned', 'burning'],
    words: ['burn', 'burned', 'burnt', 'burning', 'scorch'],
  },
  {
    id: 'freeze',
    group: 'status',
    roots: ['freeze', 'freezes', 'frozen', 'freezing'],
    words: ['freeze', 'frozen', 'froze', 'freezing'],
  },
  {
    id: 'confusion',
    group: 'status',
    roots: ['confuse', 'confuses', 'confused', 'confusion'],
    words: ['confuse', 'confused', 'confusion', 'confusing', 'dizzy'],
  },
  {
    id: 'flinch',
    group: 'status',
    roots: ['flinch', 'flinches', 'flinching'],
    words: ['flinch', 'flinching'],
  },
  {
    id: 'rain',
    group: 'weather',
    // Weather mostly appears as the move that starts it: "During Rain Dance, …"
    roots: ['rain', 'rain dance'],
    words: ['rain', 'rainy', 'raining'],
  },
  {
    id: 'sun',
    group: 'weather',
    roots: ['sunlight', 'sunny day'],
    words: ['sun', 'sunny', 'sunlight', 'sunshine'],
  },
  {
    id: 'sandstorm',
    group: 'weather',
    roots: ['sandstorm'],
    words: ['sandstorm', 'sand'],
  },
  {
    id: 'hail',
    group: 'weather',
    roots: ['hail'],
    words: ['hail', 'snow'],
  },
]
