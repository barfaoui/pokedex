import { useEffect, useState } from 'react'
import {
  configByKey,
  configOf,
  DEFAULT_CONFIG,
} from '../../../../api/_lib/models'
import { estimateRunCostUsd } from '../../../../api/_lib/pricing'
import type { EvalCase } from '@/eval/cases'
import type { AvailableEngine } from '@/eval/engines/engines'
import { ms } from '@/eval/format'
import { snapshotFor } from '@/eval/llm-snapshot'
import type { CaseRun } from '@/eval/run'
import { aiStatus, type AiStatus } from '@/features/ask-ai/ask-ai-client'
import { CaseTable } from '../CaseTable/CaseTable'
import { EngineList } from '../EngineList/EngineList'
import { FilterSelect } from '../FilterSelect/FilterSelect'
import {
  CASES,
  ENGINE_ORDER,
  FALLBACK_ID,
  LLM_ID,
  llmEngines,
  liveTransport,
  LOCAL_ENGINES,
  UNAVAILABLE,
} from '../page-engines'
import { SummaryTable } from '../SummaryTable/SummaryTable'
import { useEvalRun, type RunStatus } from '../useEvalRun'
import { useLlmLiveRun } from '../useLlmLiveRun'
import './EvalPage.scss'

interface Filters {
  category: string
  source: string
  failingOnly: boolean
  fallbackOnly: boolean
}

const ALL = ''
const NO_FILTERS: Filters = {
  category: ALL,
  source: ALL,
  failingOnly: false,
  fallbackOnly: false,
}
const byOrder = (a: AvailableEngine, b: AvailableEngine) =>
  ENGINE_ORDER.indexOf(a.id) - ENGINE_ORDER.indexOf(b.id)
const LLM_ORDER = ENGINE_ORDER.indexOf(LLM_ID)
// The fallback's name only: which run it uses is picked at Run time.
const LISTED = [...LOCAL_ENGINES, llmEngines(DEFAULT_CONFIG.key, null).fallback]
const BEFORE_LLM = LISTED.filter(
  (engine) => ENGINE_ORDER.indexOf(engine.id) < LLM_ORDER,
).sort(byOrder)
const AFTER_LLM = LISTED.filter(
  (engine) => ENGINE_ORDER.indexOf(engine.id) > LLM_ORDER,
).sort(byOrder)

export function EvalPage() {
  const [selected, setSelected] = useState<ReadonlySet<string>>(
    () =>
      new Set([
        ...LOCAL_ENGINES.map((engine) => engine.id),
        LLM_ID,
        FALLBACK_ID,
      ]),
  )
  const [model, setModel] = useState(DEFAULT_CONFIG.key)
  const [liveChosen, setLiveChosen] = useState(false)
  const [server, setServer] = useState<AiStatus | null>(null)
  const [filters, setFilters] = useState(NO_FILTERS)
  // The engines of the last Run, so a column never shows runs from another choice of model.
  const [ranEngines, setRanEngines] = useState<AvailableEngine[]>([])
  const { runs: localRuns, status, loadMs, start } = useEvalRun()
  const liveRun = useLlmLiveRun()
  useEffect(() => {
    aiStatus().then(setServer)
  }, [])

  const liveBlocked = liveBlockedReason(server, model)
  const snapshot = snapshotFor(model)
  // Without a recorded run, live is the only way to get answers.
  const live = liveChosen || !snapshot
  // Not the recorded run's average: it may come from an older, smaller prompt.
  const liveEstimateUsd = estimateRunCostUsd(
    CASES.length,
    (configByKey(model) ?? DEFAULT_CONFIG).model,
  )

  const runs = [...localRuns, ...liveRun.runs]
  const shownEngines = ranEngines.filter((engine) => selected.has(engine.id))
  const shownRuns = runs.filter((run) =>
    shownEngines.some((engine) => engine.id === run.engineId),
  )
  const cases = CASES.filter((c) => matchesFilters(c, filters, shownRuns))
  const caseIds = new Set(cases.map((c) => c.id))
  const filteredRuns = shownRuns.filter((run) => caseIds.has(run.evalCase.id))

  const busy =
    status.state === 'loading-model' ||
    status.state === 'running' ||
    liveRun.status.state === 'running'

  async function run() {
    const local = LOCAL_ENGINES.filter((engine) => selected.has(engine.id))
    const transport = live && liveBlocked === null ? liveTransport() : null
    const { llm, fallback } = llmEngines(model, transport)
    // The LLM first: a live fallback then finds its answers already asked.
    const usingLlm = [
      ...(selected.has(LLM_ID) ? [llm] : []),
      ...(selected.has(FALLBACK_ID) ? [fallback] : []),
    ]
    setRanEngines([...local, ...usingLlm].sort(byOrder))
    liveRun.clear()
    // A placeholder has nothing to run; live engines run after the rest, so their calls don't
    // skew the local timings.
    const runsHere = transport
      ? []
      : usingLlm.filter((engine) => !engine.placeholder)
    await start([...local, ...runsHere], CASES)
    if (transport && usingLlm.length) {
      await liveRun.start(usingLlm, CASES, transport.spentEur)
    }
  }

  const toggle = (id: string) =>
    setSelected((previous) => {
      const next = new Set(previous)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  const setFilter = <K extends keyof Filters>(name: K, value: Filters[K]) =>
    setFilters((previous) => ({ ...previous, [name]: value }))

  return (
    <main className="eval-page">
      <header className="eval-page__header">
        <h1 className="eval-page__title">Search evaluation</h1>
        <p className="eval-page__intro">
          {ENGINE_ORDER.length} search engines compared on the {CASES.length}{' '}
          queries of tests/eval/cases.csv.
        </p>
        <p className="eval-page__intro">
          The engines run live in this browser, except Claude Code (answers
          written once) and the LLM (a recorded run, or live), which Hybrid (D +
          LLM) uses too.
        </p>
      </header>

      <fieldset className="eval-page__group">
        <legend className="eval-page__legend">Engines</legend>
        <EngineList
          before={BEFORE_LLM}
          after={AFTER_LLM}
          unavailable={UNAVAILABLE}
          selected={selected}
          llmId={LLM_ID}
          onToggle={toggle}
          model={model}
          onModel={setModel}
          live={live}
          onLive={setLiveChosen}
          liveBlocked={liveBlocked}
          liveEstimateUsd={liveEstimateUsd}
          liveStatus={liveRun.status}
          onStop={liveRun.stop}
        />
        <div className="eval-page__actions">
          <button
            className="eval-page__run"
            type="button"
            disabled={busy || selected.size === 0}
            onClick={run}
          >
            Run
          </button>
          <span className="eval-page__status" role="status">
            {statusText(status, loadMs)}
          </span>
        </div>
      </fieldset>

      <fieldset className="eval-page__group eval-page__group--row">
        <legend className="eval-page__legend">Cases</legend>
        <FilterSelect
          label="Category"
          value={filters.category}
          options={distinct(CASES.map((c) => c.category))}
          onChange={(value) => setFilter('category', value)}
        />
        <FilterSelect
          label="Source"
          value={filters.source}
          options={distinct(CASES.map((c) => c.source))}
          onChange={(value) => setFilter('source', value)}
        />
        <label className="eval-page__option">
          <input
            type="checkbox"
            checked={filters.failingOnly}
            onChange={(event) => setFilter('failingOnly', event.target.checked)}
          />
          Failing only
        </label>
        <label className="eval-page__option">
          <input
            type="checkbox"
            checked={filters.fallbackOnly}
            onChange={(event) =>
              setFilter('fallbackOnly', event.target.checked)
            }
          />
          Fallback cases only
        </label>
      </fieldset>

      {shownEngines.length > 0 && (
        <>
          <SummaryTable engines={shownEngines} runs={filteredRuns} />
          <CaseTable cases={cases} engines={shownEngines} runs={filteredRuns} />
        </>
      )}
    </main>
  )
}

function liveBlockedReason(
  server: AiStatus | null,
  key: string,
): string | null {
  if (!server) {
    return 'checking the server…'
  }
  if (!server.configured) {
    return 'off: no AI key on this server'
  }
  const serverConfig = configOf(
    server.model ?? DEFAULT_CONFIG.model,
    server.thinking === 'disabled' ? 'disabled' : undefined,
  )
  if (serverConfig?.key !== key) {
    return `off: this server runs ${serverConfig?.label ?? server.model}`
  }
  return null
}

function matchesFilters(
  c: EvalCase,
  filters: Filters,
  runs: CaseRun[],
): boolean {
  return (
    (filters.category === ALL || c.category === filters.category) &&
    (filters.source === ALL || c.source === filters.source) &&
    (!filters.failingOnly ||
      runs.some((run) => run.evalCase.id === c.id && !run.score.passed)) &&
    (!filters.fallbackOnly ||
      runs.some((run) => run.evalCase.id === c.id && run.sentToLlm))
  )
}

function distinct(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b))
}

function statusText(status: RunStatus, loadMs: number | null): string {
  switch (status.state) {
    case 'idle':
      return ''
    case 'loading-model':
      return 'Loading the embedding model (33 MB, once)…'
    case 'running':
      return `${status.done} / ${status.total} runs`
    case 'done':
      return loadMs === null ? 'Done' : `Done · model load ${ms(loadMs)}`
    case 'failed':
      return `Failed: ${status.reason}`
  }
}
