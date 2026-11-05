import { describe, expect, test } from 'vitest'
import type { EvalCase } from '@/eval/cases'
import { percentile, scoreCase, summarize } from '@/eval/metrics'

function evalCase(fields: Partial<EvalCase>): EvalCase {
  return {
    id: '1',
    query: 'q',
    category: 'c',
    check: 'top3',
    best: [],
    ok: [],
    forbidden: [],
    source: 'coach',
    split: 'holdout',
    note: '',
    ...fields,
  }
}

describe('scoreCase', () => {
  test('ranks: Hit@1, MRR, Recall@10 and nDCG@10 on a worked example', () => {
    const score = scoreCase(
      evalCase({
        check: 'top3',
        best: ['pokemon:pikachu', 'pokemon:raichu'],
        ok: ['pokemon:rattata'],
      }),
      ['pokemon:rattata', 'pokemon:pikachu', 'pokemon:zubat'],
    )
    // Gains 1, 2, 0 against the ideal 2, 2, 1:
    // DCG = 1 + 2/log2(3) = 2.262; ideal = 2 + 2/log2(3) + 1/2 = 3.762.
    expect(score.ndcgAt10).toBeCloseTo(0.6013, 4)
    expect(score.firstBestRank).toBe(2)
    expect(score.hitAt1).toBe(0)
    expect(score.reciprocalRank).toBe(0.5)
    expect(score.recallAt10).toBeCloseTo(2 / 3)
    expect(score.passed).toBe(false)
    expect(score.failures).toEqual(['1 of 2 best items in the top 3'])
  })

  test('top N with more best items than N passes when the top N is all best', () => {
    const best = Array.from({ length: 12 }, (_, at) => `pokemon:p${at}`)
    const score = scoreCase(evalCase({ check: 'top10', best }), best)
    expect(score.passed).toBe(true)
    // 10 of 12 relevant in the top 10 is as good as 10 results can be.
    expect(score.recallAt10).toBe(1)
  })

  test('a bare forbidden name fails whatever its kind', () => {
    const score = scoreCase(
      evalCase({ check: 'first', best: ['move:sing'], forbidden: ['rest'] }),
      ['move:sing', 'move:rest'],
    )
    expect(score.passed).toBe(false)
    expect(score.forbiddenFound).toEqual(['move:rest'])
  })
})

describe('summarize', () => {
  test('false positive rate counts only nothing cases; rank means skip them', () => {
    const noise = evalCase({ check: 'nothing' })
    const named = evalCase({ check: 'first', best: ['pokemon:mew'] })
    const run = (c: EvalCase, ranked: string[], ms: number) => ({
      evalCase: c,
      score: scoreCase(c, ranked),
      ms,
      costEur: 0,
    })
    const summary = summarize([
      run(noise, ['pokemon:mew'], 1),
      run(noise, [], 2),
      run(named, ['pokemon:mew'], 3),
    ])
    expect(summary.falsePositiveRate).toBe(0.5)
    expect(summary.hitAt1).toBe(1)
    expect(summary.passRate).toBeCloseTo(2 / 3)
    expect(summary.costPer1000).toBe(0)
  })

  test('percentiles use the nearest rank', () => {
    const latencies = Array.from({ length: 20 }, (_, at) => at + 1)
    expect(percentile(latencies, 50)).toBe(10)
    expect(percentile(latencies, 95)).toBe(19)
  })
})
