import { describe, expect, test } from 'vitest'
import { readUrlState, writeUrlState } from '@/app/url-state'

describe('url state', () => {
  test('reads the query and the tab', () => {
    expect(readUrlState('?q=rain+team&tab=moves')).toEqual({
      query: 'rain team',
      tab: 'moves',
    })
  })

  test('an empty or unknown URL is the home page on All', () => {
    expect(readUrlState('')).toEqual({ query: '', tab: 'all' })
    expect(readUrlState('?tab=spaghetti')).toEqual({ query: '', tab: 'all' })
  })

  test('writes the query and leaves out the default tab, so the home page has no parameters', () => {
    expect(writeUrlState({ query: 'rain team', tab: 'all' })).toBe(
      '?q=rain+team',
    )
    expect(writeUrlState({ query: 'rain team', tab: 'moves' })).toBe(
      '?q=rain+team&tab=moves',
    )
    expect(writeUrlState({ query: '', tab: 'all' })).toBe('')
  })

  test('reading what was written gives the same state back', () => {
    const state = {
      query: 'put my opponent to sleep & more',
      tab: 'pokemon' as const,
    }
    expect(readUrlState(writeUrlState(state))).toEqual(state)
  })
})
