import { useEffect, useState } from 'react'
import type { EvalCase } from '@/eval/cases'
import { ms } from '@/eval/format'
import type { CaseRun } from '@/eval/run'
import { CaseTable } from '../CaseTable/CaseTable'
import { SummaryTable } from '../SummaryTable/SummaryTable'
import { FilterSelect } from '../FilterSelect/FilterSelect'
import { aiStatus } from '@/features/ask-ai/ask-ai-client'
import { LiveSearch } from '../LiveSearch/LiveSearch'
import { LlmPanel } from '../LlmPanel/LlmPanel'
import { CASES, ENGINES, liveLlmEngine, UNAVAILABLE } from '../page-engines'
import { useEvalRun, type RunStatus } from '../useEvalRun'
import { useLlmLiveRun } from '../useLlmLiveRun'
import './EvalPage.scss'

interface Filters {
  category: string
  source: string
  failingOnly: boolean
}

const ALL = ''
const NO_FILTERS: Filters = {
  category: ALL,
  source: ALL,
  failingOnly: false,
}

export function EvalPage() {
  const [selected, setSelected] = useState(
    () => new Set(ENGINES.map((engine) => engine.id)),
  )
  const [filters, setFilters] = useState(NO_FILTERS)
  const { runs: defaultRuns, status, loadMs, start } = useEvalRun()
  const live = useLlmLiveRun()
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null)
  const [aiModel, setAiModel] = useState<string | null>(null)
  useEffect(() => {
    aiStatus().then((status) => {
      setAiModel(status.model)
      setAiAvailable(status.configured)
    })
  }, [])

  const liveEngine = aiAvailable ? liveLlmEngine(aiModel) : null
  const runs = [...defaultRuns, ...live.runs]
  const selectedEngines = ENGINES.filter((engine) => selected.has(engine.id))
  const shownEngines = [
    ...selectedEngines.filter((engine) =>
      defaultRuns.some((run) => run.engineId === engine.id),
    ),
    ...(liveEngine && live.runs.length ? [liveEngine] : []),
  ]
  const shownRuns = runs.filter(
    (run) => selected.has(run.engineId) || run.engineId === liveEngine?.id,
  )
  const cases = CASES.filter((c) => matchesFilters(c, filters, shownRuns))
  const caseIds = new Set(cases.map((c) => c.id))
  const filteredRuns = shownRuns.filter((run) => caseIds.has(run.evalCase.id))

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
  const busy = status.state === 'loading-model' || status.state === 'running'

  return (
    <main className="eval-page">
      <h1 className="eval-page__title">Search evaluation</h1>
      <p className="eval-page__intro">
        Every engine on the {CASES.length} queries of tests/eval/cases.csv,
        timed in this browser. The first run with embeddings loads their
        33&nbsp;MB model once. {loadMs !== null && `Model load: ${ms(loadMs)}.`}
      </p>

      <div className="eval-page__controls">
        <div className="eval-page__column">
          <fieldset className="eval-page__group">
            <legend className="eval-page__legend">Engines</legend>
            {ENGINES.map((engine) => (
              <label key={engine.id} className="eval-page__option">
                <input
                  type="checkbox"
                  checked={selected.has(engine.id)}
                  onChange={() => toggle(engine.id)}
                />
                {engine.name}
              </label>
            ))}
            {UNAVAILABLE.map((id) => (
              <label key={id} className="eval-page__option">
                <input type="checkbox" disabled />
                {id} ({id === 'llm-recorded' ? 'no recorded run yet' : 'no key'}
                )
              </label>
            ))}
            <button
              className="eval-page__run"
              type="button"
              disabled={busy || !selectedEngines.length}
              onClick={() => start(selectedEngines, CASES)}
            >
              {runs.length ? 'Run again' : `Run ${CASES.length} cases`}
            </button>
            <span className="eval-page__status" role="status">
              {statusText(status)}
            </span>
          </fieldset>

          <fieldset className="eval-page__group">
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
                onChange={(event) =>
                  setFilter('failingOnly', event.target.checked)
                }
              />
              Failing only
            </label>
          </fieldset>
        </div>

        <LlmPanel
          available={aiAvailable}
          liveName={liveEngine?.name ?? null}
          cases={CASES.length}
          status={live.status}
          onStart={() => liveEngine && live.start(liveEngine, CASES)}
          onStop={live.stop}
          onDownload={() => download(live.snapshot())}
        />
      </div>

      {shownEngines.length > 0 && (
        <SummaryTable engines={shownEngines} runs={filteredRuns} />
      )}

      <LiveSearch
        engines={
          liveEngine ? [...selectedEngines, liveEngine] : selectedEngines
        }
      />

      <CaseTable cases={cases} engines={shownEngines} runs={filteredRuns} />
    </main>
  )
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
      runs.some((run) => run.evalCase.id === c.id && !run.score.passed))
  )
}

function download(snapshot: unknown) {
  if (!snapshot) {
    return
  }
  const url = URL.createObjectURL(
    new Blob([`${JSON.stringify(snapshot, null, 2)}\n`], {
      type: 'application/json',
    }),
  )
  const link = document.createElement('a')
  link.href = url
  link.download = 'llm-snapshot.json'
  link.click()
  URL.revokeObjectURL(url)
}

function distinct(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b))
}

function statusText(status: RunStatus): string {
  switch (status.state) {
    case 'idle':
      return ''
    case 'loading-model':
      return 'Loading the model…'
    case 'running':
      return `${status.done} / ${status.total} runs`
    case 'done':
      return 'Done'
    case 'failed':
      return `Failed: ${status.reason}`
  }
}
