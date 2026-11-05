import { describe, expect, it } from 'vitest'
import { dataset } from '../../../src/data/dataset'
import {
  classifySentence,
  tagItem,
} from '../../../src/search/concepts/direction'
import { CONCEPTS } from '../../../src/search/concepts/seed'
import type { Concept, ConceptId } from '../../../src/search/concepts/types'

function conceptOf(id: ConceptId): Concept {
  const concept = CONCEPTS.find((c) => c.id === id)
  expect(concept, id).toBeDefined()
  return concept as Concept
}

function tag(name: string, concept: ConceptId) {
  const item = [...dataset.moves, ...dataset.abilities].find(
    (i) => i.name === name,
  )
  expect(item, name).toBeDefined()
  return item && tagItem(item.short_effect, item.effect, conceptOf(concept))
}

describe('classifySentence', () => {
  it.each([
    ['Puts the target to sleep.', 'sleep', 'inflicts'],
    [
      'Summons strong sunlight that lasts indefinitely upon entering battle.',
      'sun',
      'starts',
    ],
    ['Prevents sleep.', 'sleep', 'prevents'],
    [
      'User falls to sleep and immediately regains all its HP.',
      'sleep',
      'self',
    ],
    ['Doubles Speed during rain.', 'rain', 'benefits'],
    ['During Rain Dance, this move has 100% accuracy.', 'rain', 'benefits'],
    ['During Sunny Day, this move has 50% accuracy.', 'sun', 'affected'],
    [
      'Causes 1/8 max HP in damage each turn during strong sunlight, but heals for 1/8 max HP during rain.',
      'rain',
      'benefits',
    ],
    [
      'Causes 1/8 max HP in damage each turn during strong sunlight, but heals for 1/8 max HP during rain.',
      'sun',
      'affected',
    ],
    ['Doubles evasion when confused.', 'confusion', 'affected'],
    [
      'Self-inflicted damage from confusion or recoil is not absorbed.',
      'confusion',
      'unclear',
    ],
  ] as const)('%s → %s: %s', (sentence, concept, direction) => {
    expect(classifySentence(sentence, conceptOf(concept))).toBe(direction)
  })

  it.each([
    ['This move cannot be selected by Sleep Talk.', 'sleep'],
    ['Never misses when used by a Poison-type Pokémon.', 'poison'],
  ] as const)(
    'skips a sentence that only mentions it: %s',
    (sentence, concept) => {
      expect(classifySentence(sentence, conceptOf(concept))).toBeUndefined()
    },
  )

  it('only matches whole words: "drains" and "trainers" are not rain', () => {
    expect(
      classifySentence(
        'Drains half the damage inflicted to heal the user.',
        conceptOf('rain'),
      ),
    ).toBeUndefined()
    expect(
      classifySentence('Forces trainers to switch Pokémon.', conceptOf('rain')),
    ).toBeUndefined()
  })
})

describe('tagItem: the traps', () => {
  it('Limber prevents paralysis', () => {
    expect(tag('limber', 'paralysis')?.direction).toBe('prevents')
  })

  it('Rest puts the user to sleep (self)', () => {
    expect(tag('rest', 'sleep')).toMatchObject({
      direction: 'self',
      source: 'short_effect',
    })
  })

  it('Dig gets no sleep tag: it only mentions Sleep Talk', () => {
    expect(tag('dig', 'sleep')).toBeUndefined()
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

  it('Solar Beam is affected by rain', () => {
    expect(tag('solar-beam', 'rain')?.direction).toBe('affected')
  })
})
