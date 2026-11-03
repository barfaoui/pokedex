// Human corrections to generated.ts, from the review, grouped like it:
// concept → corrected direction. The dictionary is generated + these.
import type { Corrections } from './types.ts'

export const CORRECTIONS: Corrections = {
  sleep: {
    unclear: [{ kind: 'ability', name: 'soundproof' }],
    affected: [{ kind: 'ability', name: 'early-bird' }],
  },
  paralysis: {
    affected: [
      { kind: 'ability', name: 'guts' },
      { kind: 'ability', name: 'quick-feet' },
    ],
  },
  poison: {
    affected: [{ kind: 'ability', name: 'guts' }],
  },
  burn: {
    affected: [{ kind: 'ability', name: 'guts' }],
  },
  confusion: {
    unclear: [{ kind: 'ability', name: 'magic-guard' }],
  },
  flinch: {
    prevents: [{ kind: 'move', name: 'substitute' }],
  },
  sandstorm: {
    affected: [{ kind: 'move', name: 'solar-beam' }],
  },
}
