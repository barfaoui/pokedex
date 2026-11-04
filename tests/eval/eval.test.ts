// Measures the search and writes a report: npm run eval. It reports, it doesn't judge: the test
// only fails if the evaluation itself can't run.
import { execSync } from 'node:child_process'
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { arch, cpus, platform } from 'node:os'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'vitest'
import { index } from '@/data/dataset'
import { QUERIES } from './queries'
import { formatReport, stamp, type CostCheck } from './report'
import { expectedKeys, runEval } from './run'

const root = new URL('../../', import.meta.url)
const PAID_PACKAGES =
  /openai|anthropic|cohere|mistral|replicate|langchain|@google\/(generative-ai|genai)|groq|together-ai|voyageai|pinecone/i
const AI_HOSTS =
  /https?:\/\/[^\s'"`]*(huggingface\.co|hf\.co|openai\.com|anthropic\.com|cohere\.|googleapis\.com|replicate\.com|mistral\.ai|groq\.com|jsdelivr\.net|unpkg\.com)[^\s'"`]*/gi
const SECRETS = /\b(api[_-]?key|bearer|authorization|access[_-]?token)\b/i

test('search evaluation', { timeout: 600_000 }, async () => {
  const unknown = QUERIES.flatMap((query) =>
    expectedKeys(query.expect).filter((key) => {
      const [kind, name] = key.split(':')
      const items =
        kind === 'pokemon'
          ? index.pokemon
          : kind === 'move'
            ? index.moves
            : index.abilities
      return !items.has(name)
    }),
  )
  // A typo would otherwise show up as a false negative of the search.
  expect(unknown, 'expected names missing from the dataset').toEqual([])

  const run = await runEval(QUERIES)
  const date = new Date()
  const report = formatReport(run, {
    date,
    commit: git('rev-parse --short HEAD') ?? 'unknown',
    dirty: dirty(),
    machine: `Node ${process.version}, ${platform()} ${arch()}, ${cpus()[0]?.model.trim() ?? 'unknown CPU'}`,
    cost: costCheck(),
  })

  const folder = new URL('eval-reports/', root)
  mkdirSync(folder, { recursive: true })
  const file = new URL(
    `${stamp(date).replace(' ', '_').replaceAll(':', '-')}.md`,
    folder,
  )
  writeFileSync(file, report)
  console.log(`${report}\nSaved to ${fileURLToPath(file)}`)
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

function costCheck(): CostCheck {
  const pkg = JSON.parse(
    readFileSync(new URL('package.json', root), 'utf8'),
  ) as Record<string, Record<string, string> | undefined>
  const packages = Object.keys({
    ...pkg.dependencies,
    ...pkg.devDependencies,
  })

  const src = new URL('src/', root)
  const remoteUrls = new Set<string>()
  const secrets: string[] = []
  // Only code: the dataset's sprite URLs are images, not part of search.
  const files = readdirSync(src, { recursive: true, encoding: 'utf8' }).filter(
    (file) => /\.(ts|tsx)$/.test(file),
  )
  for (const file of files) {
    const text = readFileSync(new URL(file.replaceAll('\\', '/'), src), 'utf8')
    for (const url of text.match(AI_HOSTS) ?? []) {
      remoteUrls.add(`${url} (${file})`)
    }
    if (SECRETS.test(text)) {
      secrets.push(file)
    }
  }

  const worker = readFileSync(
    new URL('features/semantic/semantic.worker.ts', src),
    'utf8',
  )
  return {
    paidDependencies: packages.filter((name) => PAID_PACKAGES.test(name)),
    remoteUrls: [...remoteUrls],
    secrets,
    workerLocalOnly: /allowRemoteModels\s*=\s*false/.test(worker),
  }
}
