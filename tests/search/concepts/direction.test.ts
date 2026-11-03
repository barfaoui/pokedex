import { describe, expect, it } from 'vitest'
import { dataset } from '../../../src/data/dataset'
import {
  classifySentence,
  tagItem,
} from '../../../src/search/concepts/direction'
import { CONCEPTS } from '../../../src/search/concepts/seed'
import type { ConceptId } from '../../../src/search/concepts/types'

function rootsOf(id: ConceptId): string[] {
  const concept = CONCEPTS.find((c) => c.id === id)
  expect(concept, id).toBeDefined()
  return concept?.roots ?? []
}

function tag(name: string, concept: ConceptId) {
  const item = [...dataset.moves, ...dataset.abilities].find(
    (i) => i.name === name,
  )
  expect(item, name).toBeDefined()
  return item && tagItem(item.short_effect, item.effect, rootsOf(concept))
}

describe('classifySentence', () => {
  it.each([
    ['Puts the target to sleep.', 'sleep', 'inflicts'],
    ['Has a chance to paralyze the target.', 'paralysis', 'inflicts'],
    [
      'Summons strong sunlight that lasts indefinitely upon entering battle.',
      'sun',
      'inflicts',
    ],
    ['Prevents sleep.', 'sleep', 'prevents'],
    ['This Pokémon cannot be asleep.', 'sleep', 'prevents'],
    [
      'User falls to sleep and immediately regains all its HP.',
      'sleep',
      'self',
    ],
    [
      'Hits every turn for 2-3 turns, then confuses the user.',
      'confusion',
      'self',
    ],
    ['This move cannot be selected by Sleep Talk.', 'sleep', 'mentions'],
    ['Never misses when used by a Poison-type Pokémon.', 'poison', 'mentions'],
    ['Doubles Speed during rain.', 'rain', 'affected'],
    ['During Rain Dance, this move has 100% accuracy.', 'rain', 'affected'],
    ['Doubles evasion when confused.', 'confusion', 'affected'],
    [
      'Self-inflicted damage from confusion or recoil is not absorbed.',
      'confusion',
      'unclear',
    ],
  ] as const)('%s → %s: %s', (sentence, concept, direction) => {
    expect(classifySentence(sentence, rootsOf(concept))).toBe(direction)
  })

  it('only matches whole words: "drains" and "trainers" are not rain', () => {
    expect(
      classifySentence(
        'Drains half the damage inflicted to heal the user.',
        rootsOf('rain'),
      ),
    ).toBeUndefined()
    expect(
      classifySentence('Forces trainers to switch Pokémon.', rootsOf('rain')),
    ).toBeUndefined()
  })
})

describe('tagItem: the traps', () => {
  it('Limber prevents paralysis', () => {
    expect(tag('limber', 'paralysis')?.direction).toBe('prevents')
  })

  it.each(['insomnia', 'vital-spirit'])('%s prevents sleep', (name) => {
    expect(tag(name, 'sleep')?.direction).toBe('prevents')
  })

  it('Rest puts the user to sleep (self)', () => {
    expect(tag('rest', 'sleep')).toMatchObject({
      direction: 'self',
      source: 'short_effect',
    })
  })

  it('Dig only mentions sleep (Sleep Talk)', () => {
    expect(tag('dig', 'sleep')?.direction).toBe('mentions')
  })

  it('Effect Spore inflicts sleep, despite the "inflcting" typo in the data', () => {
    expect(tag('effect-spore', 'sleep')?.direction).toBe('inflicts')
  })

  it('Sing inflicts sleep, with its sentence as evidence', () => {
    expect(tag('sing', 'sleep')).toEqual({
      direction: 'inflicts',
      evidence: 'Puts the target to sleep.',
      source: 'short_effect',
    })
  })

  it('gives no tag when the concept never appears', () => {
    expect(tag('tackle', 'sleep')).toBeUndefined()
  })
})
