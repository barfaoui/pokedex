// `npm run eval [-- --engine <id>] [--model <id>] [--save] [--fresh] [--yes]`: vitest rejects
// options it doesn't know, so they reach tests/eval/eval.test.ts as EVAL_* variables.
//   --engine <id>  only this engine; `llm` runs the LLM live (key from .env.local, see .env.example)
//   --model <id>   the LLM's model, one of src/eval/llm-models.ts
//   --prompt-version <n>  which recorded run of that model (default: the latest)
//   --save         with --engine llm: write tests/eval/llm-snapshots/<model>.prompt-v<n>.json, no report
//   --fresh        with --engine llm: ignore the answers cached in .cache/ask-ai/
//   --yes          with --engine llm: spend the estimated cost printed without it
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'

const args = process.argv.slice(2)
const valueOf = (name: string): string | undefined => {
  const at = args.indexOf(name)
  return at === -1 ? undefined : args[at + 1]
}
const withValue = ['--engine', '--model', '--prompt-version']
const known = [...withValue, '--save', '--fresh', '--yes']
const unknown = args.filter((arg, at) =>
  arg.startsWith('--')
    ? !known.includes(arg)
    : !withValue.includes(args[at - 1]),
)
if (unknown.length) {
  console.error(`Unknown: ${unknown.join(' ')}. Options: ${known.join(' ')}`)
  process.exit(1)
}

const engine = valueOf('--engine')
if (engine === 'llm' && existsSync('.env.local')) {
  process.loadEnvFile('.env.local')
}

const flag = (name: string) => (args.includes(name) ? '1' : undefined)
const variables = {
  EVAL_ENGINE: engine,
  EVAL_MODEL: valueOf('--model'),
  EVAL_PROMPT_VERSION: valueOf('--prompt-version'),
  EVAL_SAVE: flag('--save'),
  EVAL_FRESH: flag('--fresh'),
  EVAL_YES: flag('--yes'),
}
const result = spawnSync(
  'npx',
  ['vitest', 'run', '--project', 'eval', '--silent=false'],
  {
    stdio: 'inherit',
    // npx is a .cmd on Windows, which only runs through a shell. The arguments are fixed.
    shell: process.platform === 'win32',
    env: {
      ...process.env,
      ...Object.fromEntries(
        Object.entries(variables).filter(([, value]) => value !== undefined),
      ),
    },
  },
)
process.exit(result.status ?? 1)
