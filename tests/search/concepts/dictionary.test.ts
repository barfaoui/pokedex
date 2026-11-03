import { describe, expect, it } from 'vitest'
import { DICTIONARY } from '../../../src/search/concepts/dictionary'

describe('concept dictionary', () => {
  it('lists exactly what inflicts sleep', () => {
    expect(
      DICTIONARY.sleep.inflicts.map(({ kind, name }) => `${kind} ${name}`),
    ).toEqual([
      'move sing',
      'move sleep-powder',
      'move hypnosis',
      'move lovely-kiss',
      'move spore',
      'ability effect-spore',
    ])
  })
})
