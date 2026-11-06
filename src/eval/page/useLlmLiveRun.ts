import { useCallback, useRef, useState } from 'react'
import type { EvalCase } from '@/eval/cases'
import type { AvailableEngine } from '@/eval/engines/engines'
import { runCase, type CaseRun } from '@/eval/run'

// Four calls at a time, after a first one alone so that it writes the prompt cache for the rest.
const CONCURRENCY = 4

export type LiveStatus =
  | { state: 'idle' }
  | {
      state: 'running' | 'stopped' | 'done'
      done: number
      total: number
      failed: number
      spentEur: number
    }

export function useLlmLiveRun() {
  const [runs, setRuns] = useState<CaseRun[]>([])
  const [status, setStatus] = useState<LiveStatus>({ state: 'idle' })
  const stopping = useRef(false)

  const start = useCallback(
    async (engine: AvailableEngine, cases: EvalCase[]) => {
      stopping.current = false
      setRuns([])
      let done = 0
      let failed = 0
      let spentEur = 0
      const report = (state: 'running' | 'stopped' | 'done') =>
        setStatus({ state, done, total: cases.length, failed, spentEur })
      report('running')

      const one = async (evalCase: EvalCase) => {
        try {
          const run = await runCase(engine, evalCase)
          spentEur += run.costEur
          setRuns((previous) => [...previous, run])
        } catch {
          failed++
        }
        done++
        report('running')
      }

      let next = 0
      const worker = async () => {
        while (next < cases.length && !stopping.current) {
          await one(cases[next++])
        }
      }
      if (cases.length) {
        await one(cases[next++])
      }
      await Promise.all(Array.from({ length: CONCURRENCY }, worker))
      report(stopping.current ? 'stopped' : 'done')
    },
    [],
  )

  const stop = useCallback(() => {
    stopping.current = true
  }, [])

  const clear = useCallback(() => {
    setRuns([])
    setStatus({ state: 'idle' })
  }, [])

  return { runs, status, start, stop, clear }
}
