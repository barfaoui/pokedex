import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
// Split so this file doesn't match itself.
const KEY_PREFIX = 'sk-' + 'ant-'
// Shorter values would match by accident; a real key is far longer.
const MIN_SECRET_LENGTH = 20

const secret = process.env.ANTHROPIC_API_KEY?.trim()
const needles = [
  KEY_PREFIX,
  ...(secret && secret.length >= MIN_SECRET_LENGTH ? [secret] : []),
]

function filesUnder(folder: string): string[] {
  return readdirSync(folder).flatMap((name) => {
    const path = join(folder, name)
    return statSync(path).isDirectory() ? filesUnder(path) : [path]
  })
}

const tracked = execFileSync('git', ['ls-files', '-z'], {
  cwd: root,
  encoding: 'utf8',
})
  .split('\0')
  .filter(Boolean)
  .map((file) => join(root, file))
  .filter((file) => existsSync(file))

const dist = join(root, 'dist')
if (!existsSync(dist)) {
  console.error('dist/ is missing: run `npm run build` first.')
  process.exit(1)
}

const leaks = [...filesUnder(dist), ...tracked].filter((file) => {
  const text = readFileSync(file).toString('latin1')
  return needles.some((needle) => text.includes(needle))
})

if (leaks.length) {
  // Only the file names: printing the match would print the key.
  console.error('A secret was found in:')
  for (const file of leaks) {
    console.error(`  ${relative(root, file)}`)
  }
  process.exit(1)
}
console.log(
  `No secret in dist/ or in ${tracked.length} tracked files` +
    (secret ? ' (ANTHROPIC_API_KEY checked too).' : '.'),
)
