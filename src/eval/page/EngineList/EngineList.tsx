import { USD_TO_EUR } from '../../../../api/_lib/pricing'
import type { AvailableEngine } from '@/eval/engines/engines'
import { MODEL_CONFIGS } from '../../../../api/_lib/models'
import {
  dollars,
  NO_RUN_YET,
  recordedLabel,
  snapshotFor,
} from '@/eval/llm-snapshot'
import type { LiveStatus } from '../useLlmLiveRun'
import './EngineList.scss'

interface EngineListProps {
  /** The other engines, in page order around the LLM. */
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
  /** Why live runs are off, null when they can be used. */
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
  const snapshot = snapshotFor(model)
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
        {MODEL_CONFIGS.map((config) => (
          <option key={config.key} value={config.key}>
            {config.label}
          </option>
        ))}
      </select>
      <label className="engine-list__option">
        <input
          type="radio"
          name="llm-source"
          checked={!live}
          disabled={!snapshot || running}
          onChange={() => onLive(false)}
        />
        {snapshot ? recordedLabel(snapshot) : `recorded: ${NO_RUN_YET}`}
      </label>
      <label className="engine-list__option">
        <input
          type="radio"
          name="llm-source"
          checked={live && !liveBlocked}
          disabled={liveBlocked !== null || running}
          onChange={() => onLive(true)}
        />
        live run
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
