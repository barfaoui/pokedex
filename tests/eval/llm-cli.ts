// The LLM engine's live transport in the CLI: the same server module as /api/ask-ai, with answers
// cached on disk in .cache/ask-ai/ (gitignored), so a rerun is free. --fresh ignores the cache.
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import {
  askAi,
  PROMPT_VERSION,
  sanitizeQuery,
  type AiAnswer,
} from '../../api/_lib/ask-ai'
import type { ModelConfig } from '../../api/_lib/models'

const CACHE = new URL('../../.cache/ask-ai/', import.meta.url)
// Four calls at a time, after a first one alone so that it writes the prompt cache for the rest.
const CONCURRENCY = 4

export interface CliLlm {
  /** Answers from `fetchAll` only: the engine never calls the provider itself. */
  askAi: (query: string) => Promise<AiAnswer>
  /** How many of these queries would call the provider; the others are cached. */
  uncached: (queries: string[]) => number
  /** Asks every query, cached ones from disk. Returns the queries that got no answer. */
  fetchAll: (queries: string[]) => Promise<string[]>
}

export function cliLlm(
  apiKey: string,
  config: ModelConfig,
  fresh: boolean,
): CliLlm {
  const answers = new Map<string, AiAnswer>()
  const fileOf = (query: string) =>
    new URL(
      `${createHash('sha256')
        .update(`${config.key}\n${PROMPT_VERSION}\n${sanitizeQuery(query)}`)
        .digest('hex')}.json`,
      CACHE,
    )
  const cached = (query: string) => !fresh && existsSync(fileOf(query))

  const fetchOne = async (query: string) => {
    const file = fileOf(query)
    if (cached(query)) {
      answers.set(query, JSON.parse(readFileSync(file, 'utf8')) as AiAnswer)
      return
    }
    const answer = await askAi(query, {
      apiKey,
      model: config.model,
      thinking: config.thinking,
      log: (message) => console.error(message),
    })
    mkdirSync(CACHE, { recursive: true })
    writeFileSync(file, JSON.stringify(answer))
    answers.set(query, answer)
  }

  return {
    uncached: (queries) => queries.filter((q) => !cached(q)).length,
    fetchAll: async (queries) => {
      const failed: string[] = []
      const attempt = (query: string) =>
        fetchOne(query).catch(() => {
          failed.push(query)
        })
      const [first, ...rest] = queries
      if (first !== undefined) {
        await attempt(first)
      }
      let next = 0
      const worker = async () => {
        while (next < rest.length) {
          await attempt(rest[next++])
        }
      }
      await Promise.all(Array.from({ length: CONCURRENCY }, worker))
      return failed
    },
    askAi: async (query) => {
      const answer = answers.get(query)
      if (!answer) {
        throw new Error(`No answer fetched for "${query}"`)
      }
      return answer
    },
  }
}
