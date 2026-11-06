import { USD_TO_EUR } from '../../../../api/_lib/pricing'
import type { AvailableEngine } from '@/eval/engines/engines'
import { modelLabel } from '@/eval/format'
import { LLM_MODELS } from '@/eval/llm-models'
import {
  dollars,
  LLM_SNAPSHOTS,
  NO_RUN_YET,
  recordedLabel,
} from '@/eval/llm-snapshot'
import type { LiveStatus } from '../useLlmLiveRun'
import './EngineList.scss'

interface EngineListProps {
  /** Every engine but the LLM, in page order around it. */
  before: AvailableEngine[]
  after: AvailableEngine[]
  unavailable: string[]
  selected: ReadonlySet<string>
  llmId: string
  onToggle: (id: string) => void
  model: string
  onModel: (model: string) => void
  live: boolean
  onLive: (live: boolean) => void
  /** Why the live toggle is off, null when it can be used. */
  liveBlocked: string | null
  /** What a live run of every case would cost, in dollars. */
  liveEstimateUsd: number
  liveStatus: LiveStatus
  onStop: () => void
}

export function EngineList(props: EngineListProps) {
  const { before, after, unavailable, selected, onToggle } = props
  const option = (engine: AvailableEngine) => (
    <li key={engine.id} className="engine-list__item">
      <label className="engine-list__option">
        <input
          type="checkbox"
          checked={selected.has(engine.id)}
          onChange={() => onToggle(engine.id)}
        />
        {engine.name}
      </label>
    </li>
  )
  return (
    <ul className="engine-list">
      {before.map(option)}
      <LlmItem {...props} />
      {after.map(option)}
      {unavailable.map((id) => (
        <li key={id} className="engine-list__item">
          <label className="engine-list__option">
            <input type="checkbox" disabled />
            {id} (no key)
          </label>
        </li>
      ))}
    </ul>
  )
}

function LlmItem({
  selected,
  llmId,
  onToggle,
  model,
  onModel,
  live,
  onLive,
  liveBlocked,
  liveEstimateUsd,
  liveStatus,
  onStop,
}: EngineListProps) {
  const snapshot = LLM_SNAPSHOTS.get(model)
  const running = liveStatus.state === 'running'
  return (
    <li className="engine-list__item">
      <label className="engine-list__option">
        <input
          type="checkbox"
          checked={selected.has(llmId)}
          onChange={() => onToggle(llmId)}
        />
        LLM
      </label>
      <select
        className="engine-list__select"
        aria-label="LLM model"
        value={model}
        disabled={running}
        onChange={(event) => onModel(event.target.value)}
      >
        {LLM_MODELS.map((id) => (
          <option key={id} value={id}>
            {modelLabel(id)}
          </option>
        ))}
      </select>
      <span className="engine-list__note">
        {snapshot ? recordedLabel(snapshot) : NO_RUN_YET}
      </span>
      <label className="engine-list__option">
        <input
          type="checkbox"
          checked={live && !liveBlocked}
          disabled={liveBlocked !== null || running}
          onChange={(event) => onLive(event.target.checked)}
        />
        run live
      </label>
      {liveBlocked !== null && (
        <span className="engine-list__note">{liveBlocked}</span>
      )}
      {live && !liveBlocked && liveStatus.state === 'idle' && (
        <span className="engine-list__note">
          about {dollars(liveEstimateUsd)} a run, through /api/ask-ai
        </span>
      )}
      {liveStatus.state !== 'idle' && (
        <span className="engine-list__note" role="status">
          {liveStatus.state === 'running'
            ? 'Live: '
            : liveStatus.state === 'stopped'
              ? 'Stopped: '
              : 'Live done: '}
          {liveStatus.done} / {liveStatus.total} ·{' '}
          {dollars(liveStatus.spentEur / USD_TO_EUR)} spent
          {liveStatus.failed ? ` · ${liveStatus.failed} without an answer` : ''}
        </span>
      )}
      {running && (
        <button className="engine-list__stop" type="button" onClick={onStop}>
          Stop
        </button>
      )}
    </li>
  )
}
