import { useCallback, useRef, useState } from 'react'
import type { EvalCase } from '@/eval/cases'
import type { AvailableEngine } from '@/eval/engines/engines'
import { runAll, warmUp, type CaseRun } from '@/eval/run'
import { modelLoadMs } from './page-engines'

// Re-rendering the table on every one of 500+ runs makes the page itself the bottleneck.
const FLUSH_EVERY = 20

export type RunStatus =
  | { state: 'idle' }
  | { state: 'loading-model' }
  | { state: 'running'; done: number; total: number }
  | { state: 'done' }
  | { state: 'failed'; reason: string }

export function useEvalRun() {
  const [runs, setRuns] = useState<CaseRun[]>([])
  const [status, setStatus] = useState<RunStatus>({ state: 'idle' })
  const [loadMs, setLoadMs] = useState<number | null>(null)
  const running = useRef(false)

  const start = useCallback(
    async (engines: AvailableEngine[], cases: EvalCase[]) => {
      if (running.current) {
        return
      }
      running.current = true
      setRuns([])
      try {
        setStatus({ state: 'loading-model' })
        await warmUp(engines)
        const load = modelLoadMs()
        setLoadMs(load ? await load : null)

        const total = engines.length * cases.length
        let buffer: CaseRun[] = []
        let done = 0
        setStatus({ state: 'running', done, total })
        await runAll(engines, cases, (run) => {
          buffer.push(run)
          done++
          if (buffer.length >= FLUSH_EVERY) {
            const flushed = buffer
            buffer = []
            setRuns((previous) => [...previous, ...flushed])
            setStatus({ state: 'running', done, total })
          }
        })
        setRuns((previous) => [...previous, ...buffer])
        setStatus({ state: 'done' })
      } catch (error) {
        setStatus({ state: 'failed', reason: String(error) })
      } finally {
        running.current = false
      }
    },
    [],
  )

  return { runs, status, loadMs, start }
}
