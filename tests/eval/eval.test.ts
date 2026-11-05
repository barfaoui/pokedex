// Measures every engine on tests/eval/cases.csv and writes a report: npm run eval. It reports, it
// doesn't judge: the test only fails if the evaluation itself can't run.
import { execSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { arch, cpus, platform } from 'node:os'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'vitest'
import type { SemanticSearch } from '@/eval/engines/engine'
import { availableEngines, ENGINE_DEFINITIONS } from '@/eval/engines/engines'
import { runAll, warmUp } from '@/eval/run'
import { formatReport, stamp } from './report'
import { loadCases, nodeSemantic, unknownItems } from './run'

const root = new URL('../../', import.meta.url)

test('search evaluation', { timeout: 900_000 }, async () => {
  const cases = loadCases()
  expect(unknownItems(cases), 'items missing from the dataset').toEqual([])

  let semantic: SemanticSearch | undefined
  const engines = availableEngines({
    semantic: () => (semantic ??= nodeSemantic()),
    env: process.env,
  })
  const skipped = ENGINE_DEFINITIONS.filter(
    (definition) => !engines.some((engine) => engine.id === definition.id),
  ).map((definition) => `${definition.id} (no key)`)

  await warmUp(engines)
  const modelLoadMs = semantic ? await semantic.ready() : null
  const runs = await runAll(engines, cases)

  const date = new Date()
  const report = formatReport(engines, runs, {
    date,
    commit: git('rev-parse --short HEAD') ?? 'unknown',
    dirty: dirty(),
    machine: `Node ${process.version}, ${platform()} ${arch()}, ${cpus()[0]?.model.trim() ?? 'unknown CPU'}`,
    modelLoadMs,
    skipped,
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
