import { useState } from 'react'
import { estimateRunCostUsd, USD_TO_EUR } from '../../../../api/_lib/pricing'
import { modelLabel } from '@/eval/format'
import {
  dollars,
  LLM_SNAPSHOT,
  NO_RECORDED_RUN,
  snapshotSummary,
} from '@/eval/llm-snapshot'
import type { LiveStatus } from '../useLlmLiveRun'
import './LlmPanel.scss'

interface LlmPanelProps {
  /** null while asking the server whether it has a key. */
  available: boolean | null
  /** The live engine's label, with its model; null without a key. */
  liveName: string | null
  cases: number
  status: LiveStatus
  onStart: () => void
  onStop: () => void
  onDownload: () => void
}

export function LlmPanel({
  available,
  liveName,
  cases,
  status,
  onStart,
  onStop,
  onDownload,
}: LlmPanelProps) {
  const [confirming, setConfirming] = useState(false)
  const running = status.state === 'running'
  // The recorded run's own average, when there is one: closer than a token count.
  const estimate = LLM_SNAPSHOT?.cases.length
    ? (LLM_SNAPSHOT.totalCostUsd / LLM_SNAPSHOT.cases.length) * cases
    : estimateRunCostUsd(cases)

  return (
    <section className="llm-panel" aria-label="LLM engine">
      <h2 className="llm-panel__title">LLM (Ask AI)</h2>
      <p className="llm-panel__line">
        {LLM_SNAPSHOT
          ? `Recorded run: ${snapshotSummary(LLM_SNAPSHOT)}. Tick “LLM: ${modelLabel(LLM_SNAPSHOT.model)} (recorded)” and run the cases to see it.`
          : `${NO_RECORDED_RUN}.`}
      </p>
      {status.state === 'idle' && (
        <p className="llm-panel__line">
          The LLM isn&rsquo;t in the default run: it calls a paid API. Run it
          live at least once to compare it with the other engines; its results
          then join the tables below as the &ldquo;{liveName ?? 'LLM'}&rdquo;
          column.
        </p>
      )}

      {available === false && (
        <p className="llm-panel__line">
          Live runs are off: this server has no AI key.
        </p>
      )}

      <div className="llm-panel__actions">
        {!confirming && !running && (
          <button
            className="llm-panel__button"
            type="button"
            disabled={available !== true}
            onClick={() => setConfirming(true)}
          >
            Run LLM live
          </button>
        )}
        {confirming && (
          <>
            <span className="llm-panel__line">
              {cases} queries through /api/ask-ai, about {dollars(estimate)}.
            </span>
            <button
              className="llm-panel__button"
              type="button"
              onClick={() => {
                setConfirming(false)
                onStart()
              }}
            >
              Start
            </button>
            <button
              className="llm-panel__button"
              type="button"
              onClick={() => setConfirming(false)}
            >
              Cancel
            </button>
          </>
        )}
        {running && (
          <button className="llm-panel__button" type="button" onClick={onStop}>
            Stop
          </button>
        )}
        {(status.state === 'done' || status.state === 'stopped') && (
          <button
            className="llm-panel__button"
            type="button"
            onClick={onDownload}
          >
            Download as snapshot
          </button>
        )}
      </div>

      {status.state !== 'idle' && (
        <p className="llm-panel__line" role="status">
          {status.state === 'running'
            ? 'Running: '
            : status.state === 'stopped'
              ? 'Stopped: '
              : 'Done: '}
          {status.done} / {status.total} queries ·{' '}
          {dollars(status.spentEur / USD_TO_EUR)} spent
          {status.failed ? ` · ${status.failed} without an answer` : ''}
        </p>
      )}
      {(status.state === 'done' || status.state === 'stopped') && (
        <p className="llm-panel__line">
          To make it the recorded run, save the download as
          tests/eval/llm-snapshot.json and commit it.
        </p>
      )}
    </section>
  )
}
