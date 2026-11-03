import { describe, expect, it } from 'vitest'
import { search } from '../../src/search/search'

describe('multi-word names', () => {
  it('"double team" → Double Team first, as an exact match, though "team" is a filler word', () => {
    expect(search('double team')[0]).toMatchObject({
      item: { name: 'double-team' },
      score: 1,
    })
  })

  it('"mr mime" → Mr. Mime, as an exact match', () => {
    expect(search('mr mime')[0]).toMatchObject({
      item: { name: 'mr-mime' },
      score: 1,
    })
  })
})
