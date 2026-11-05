// Human corrections to generated.ts from the review; the dictionary is generated + these.
import type { Corrections } from './types'

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
    copies: [{ kind: 'ability', name: 'synchronize' }],
  },
  poison: {
    affected: [{ kind: 'ability', name: 'guts' }],
    copies: [{ kind: 'ability', name: 'synchronize' }],
  },
  burn: {
    affected: [{ kind: 'ability', name: 'guts' }],
    copies: [{ kind: 'ability', name: 'synchronize' }],
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
