// It reports, it doesn't judge: the test only fails if the evaluation itself can't run.
// Run through `npm run eval` (scripts/eval.ts), which turns its options into the EVAL_* variables.
// EVAL_SNAPSHOT=<file.json> writes the numbers and every case's outcome there instead of a report,
// to compare two runs.
import { execSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { arch, cpus, platform } from 'node:os'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'vitest'
import { PROMPT_VERSION } from '../../api/_lib/ask-ai'
import { estimateRunCostUsd } from '../../api/_lib/pricing'
import type { SemanticSearch } from '@/eval/engines/engine'
import { availableEngines, ENGINE_DEFINITIONS } from '@/eval/engines/engines'
import { NEEDS_LLM_RUN } from '@/eval/engines/llm-fallback.engine'
import { DEFAULT_LLM_MODEL, LLM_MODELS } from '@/eval/llm-models'
import {
  buildSnapshot,
  dollars,
  NO_RUN_YET,
  promptNumber,
  snapshotFor,
  snapshotPath,
} from '@/eval/llm-snapshot'
import { summarize } from '@/eval/metrics'
import { keyOf, runAll, warmUp, type CaseRun } from '@/eval/run'
import { cliLlm, type CliLlm } from './llm-cli'
import { formatReport, stamp } from './report'
import { loadCases, nodeSemantic, unknownItems } from './run'

const root = new URL('../../', import.meta.url)

test('search evaluation', { timeout: 900_000 }, async () => {
  const only = process.env.EVAL_ENGINE
  const model = process.env.EVAL_MODEL ?? DEFAULT_LLM_MODEL
  const live = only === 'llm'
  const save = process.env.EVAL_SAVE === '1'
  const promptVersion = process.env.EVAL_PROMPT_VERSION
    ? Number(process.env.EVAL_PROMPT_VERSION)
    : undefined
  if (
    live &&
    promptVersion !== undefined &&
    promptVersion !== promptNumber(PROMPT_VERSION)
  ) {
    throw new Error(
      `A live run uses the current prompt, ${PROMPT_VERSION}: leave out --prompt-version`,
    )
  }
  if (!LLM_MODELS.includes(model)) {
    throw new Error(`Unknown model ${model}: one of ${LLM_MODELS.join(', ')}`)
  }
  if (only && !ENGINE_DEFINITIONS.some((d) => d.id === only)) {
    throw new Error(
      `Unknown engine ${only}: one of ${ENGINE_DEFINITIONS.map((d) => d.id).join(', ')}`,
    )
  }
  if (save && !live) {
    throw new Error('--save records an LLM run: add --engine llm')
  }

  const cases = loadCases()
  expect(unknownItems(cases), 'items missing from the dataset').toEqual([])
  const queries = [...new Set(cases.map((c) => c.query))]

  let cli: CliLlm | undefined
  if (live) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error(
        'ANTHROPIC_API_KEY is not set: add it to .env.local (see .env.example)',
      )
    }
    cli = cliLlm(apiKey, model, process.env.EVAL_FRESH === '1')
    const uncached = cli.uncached(queries)
    console.log(
      `LLM ${model}: ${uncached} of ${queries.length} queries to ask, the others are cached. Estimated cost: ${dollars(estimateRunCostUsd(uncached))}.`,
    )
    if (uncached > 0 && process.env.EVAL_YES !== '1') {
      console.log('Nothing was called. Add --yes to run it.')
      return
    }
    const failed = await cli.fetchAll(queries)
    if (failed.length) {
      throw new Error(
        `${failed.length} queries got no answer (the others are cached, a rerun only asks these): ${failed.join(' · ')}`,
      )
    }
  }

  let semantic: SemanticSearch | undefined
  const engines = availableEngines({
    semantic: () => (semantic ??= nodeSemantic()),
    env: process.env,
    llm: {
      model,
      ...(promptVersion !== undefined ? { promptVersion } : {}),
      ...(cli ? { askAi: cli.askAi } : {}),
    },
  }).filter((engine) => !only || engine.id === only)
  const skipped = ENGINE_DEFINITIONS.filter(
    (definition) => !engines.some((engine) => engine.id === definition.id),
  ).map(
    (definition) =>
      `${definition.id} (${only ? 'not selected' : whyNotRun(definition.id)})`,
  )

  await warmUp(engines)
  const modelLoadMs = semantic ? await semantic.ready() : null
  const runs = await runAll(engines, cases)

  if (save && cli) {
    const answers = await Promise.all(
      queries.map(async (query) => ({
        id: cases.find((c) => c.query === query)!.id,
        query,
        answer: await cli.askAi(query),
      })),
    )
    const recorded = buildSnapshot(answers)
    const file = new URL(snapshotPath(model, recorded.promptVersion), root)
    mkdirSync(new URL('./', file), { recursive: true })
    writeFileSync(file, `${JSON.stringify(recorded, null, 2)}\n`)
    const summary = summarize(runs)
    console.log(
      `Saved to ${fileURLToPath(file)}: ${summary.passed} of ${summary.cases} passed, ${dollars(recorded.totalCostUsd)} for the answers.`,
    )
    return
  }

  const snapshotFile = process.env.EVAL_SNAPSHOT
  if (snapshotFile) {
    writeFileSync(snapshotFile, JSON.stringify(snapshot(engines, runs)))
    console.log(`Snapshot saved to ${snapshotFile}`)
    return
  }

  const date = new Date()
  const report = formatReport(engines, runs, {
    date,
    commit: git('rev-parse --short HEAD') ?? 'unknown',
    dirty: dirty(),
    machine: `Node ${process.version}, ${platform()} ${arch()}, ${cpus()[0]?.model.trim() ?? 'unknown CPU'}`,
    modelLoadMs,
    skipped,
    llmNote:
      live || snapshotFor(model, promptVersion) || only
        ? ''
        : `${model}${promptVersion === undefined ? '' : `, prompt v${promptVersion}`}: ${NO_RUN_YET}. Record one with \`npm run eval -- --engine llm --model ${model} --save\`.`,
  })

  const folder = new URL('eval-reports/', root)
  mkdirSync(folder, { recursive: true })
  const file = new URL(
    `${stamp(date).replace(' ', '_').replaceAll(':', '-')}.md`,
    folder,
  )
  writeFileSync(file, report)
  console.log(`Saved to ${fileURLToPath(file)}`)
})

function snapshot(engines: { id: string; name: string }[], runs: CaseRun[]) {
  return {
    engines: engines.map((engine) => {
      const own = runs.filter((run) => run.engineId === engine.id)
      return { id: engine.id, name: engine.name, summary: summarize(own) }
    }),
    cases: runs.map((run) => ({
      engine: run.engineId,
      id: run.evalCase.id,
      query: run.evalCase.query,
      category: run.evalCase.category,
      source: run.evalCase.source,
      passed: run.score.passed,
      failures: run.score.failures,
      firstBestRank: run.score.firstBestRank,
      hitAt1: run.score.hitAt1,
      recallAt10: run.score.recallAt10,
      reciprocalRank: run.score.reciprocalRank,
      ndcgAt10: run.score.ndcgAt10,
      check: run.evalCase.check,
      top: run.results.slice(0, 10).map(keyOf),
      count: run.results.length,
      ...(run.sentToLlm !== undefined ? { sentToLlm: run.sentToLlm } : {}),
    })),
  }
}

function whyNotRun(id: string): string {
  switch (id) {
    case 'llm':
      return NO_RUN_YET
    case 'llm-fallback':
      return NEEDS_LLM_RUN
    default:
      return 'no key'
  }
}

function git(command: string): string | null {
  try {
    return execSync(`git ${command}`, { cwd: root, encoding: 'utf8' }).trim()
  } catch {
    return null
  }
}

function dirty(): boolean | null {
  const status = git('status --porcelain')
  return status === null ? null : status.length > 0
}
