import { describe, expect, it } from 'vitest'
import { inflictorsOf } from '../../../src/search/concepts/dictionary'

describe('concept dictionary', () => {
  it('lists exactly what inflicts sleep', () => {
    expect(inflictorsOf('sleep')).toEqual({
      moves: new Set([
        'sing',
        'sleep-powder',
        'hypnosis',
        'lovely-kiss',
        'spore',
      ]),
      abilities: new Set(['effect-spore']),
    })
  })
})
