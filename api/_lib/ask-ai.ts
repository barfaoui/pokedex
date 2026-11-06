// The whole "Ask AI" logic, shared by the serverless function and the Vite dev middleware.
// Server-only: the browser never imports it (the app and the eval page only import its types).
// No imports from src/: the serverless function can't resolve them.
import { CATALOGUE_LINES } from './catalogue.js'
import { costUsd } from './pricing.js'
import { systemPrompt } from './system-prompt.js'

export { costUsd, PRICES_PER_MILLION, USD_TO_EUR } from './pricing.js'

const DEFAULT_MODEL = 'claude-haiku-5-5'
// Bump when the prompt changes, so cached answers and snapshots from an older prompt are told apart.
const PROMPT_VERSION = 'ask-ai-1'
const MAX_QUERY_LENGTH = 200
const MAX_RESULTS = 10
export const MAX_NOTE_LENGTH = 120
const MAX_TOKENS = 800
// Two attempts and the pause between them stay well under the function's maxDuration (vercel.json).
const TIMEOUT_MS = 15_000
const RETRY_DELAY_MS = 800
const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504, 529])
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_VERSION = '2023-06-01'

// Fixed messages: the client never sees an upstream error, a header or an environment value.
export const MESSAGES = {
  notConfigured: 'AI search is not configured',
  unavailable: 'AI unavailable',
  invalidQuery: 'Invalid query',
  tooLong: `Query too long (${MAX_QUERY_LENGTH} characters at most)`,
  postOnly: 'Use POST with a JSON body { "query": "…" }',
  jsonOnly: 'Send the query as application/json',
  answerUnavailable: 'AI answer unavailable',
} as const

export interface AiEntry {
  key: string
  note: string
}

export interface AiUsage {
  latencyMs: number
  inputTokens: number
  cacheReadTokens: number
  cacheWriteTokens: number
  outputTokens: number
  costUsd: number
}

export interface AiAnswer {
  results: AiEntry[]
  /** Set when the answer couldn't be read: the results are then empty. */
  note?: string
  usage: AiUsage
  model: string
  promptVersion: string
}

export interface AskAiConfig {
  apiKey: string | undefined
  model?: string
  /** Swapped in tests for a stand-in response. */
  fetch?: typeof fetch
  /** Server logs only: never given a key, a header or an upstream body. */
  log?: (message: string) => void
}

const KNOWN_KEYS: ReadonlySet<string> = new Set(
  CATALOGUE_LINES.map((line) => line.slice(0, line.indexOf(' |'))),
)

const SYSTEM_PROMPT = systemPrompt(MAX_RESULTS, MAX_NOTE_LENGTH)

const CATALOGUE = `<catalogue>\n${CATALOGUE_LINES.join('\n')}\n</catalogue>`

class AiError extends Error {}

/** Control and invisible characters go, and so does any tag that would close the query block. */
export function sanitizeQuery(raw: string): string {
  return raw
    .replace(/[\p{Cc}\p{Cf}]/gu, ' ')
    .replace(/<\s*\/?\s*query\b[^>]*>/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Only known keys survive, each once, at most 10, with a plain-text note of 120 characters at
 * most. Anything that isn't that shape gives an empty list and a note.
 */
export function readAnswer(text: string): Pick<AiAnswer, 'results' | 'note'> {
  const parsed = parseJsonObject(text)
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    !Array.isArray((parsed as { results?: unknown }).results)
  ) {
    return { results: [], note: MESSAGES.answerUnavailable }
  }
  const results: AiEntry[] = []
  for (const entry of (parsed as { results: unknown[] }).results) {
    if (results.length >= MAX_RESULTS) {
      break
    }
    if (!entry || typeof entry !== 'object') {
      continue
    }
    const { key, note } = entry as { key?: unknown; note?: unknown }
    if (
      typeof key !== 'string' ||
      !KNOWN_KEYS.has(key) ||
      results.some((result) => result.key === key)
    ) {
      continue
    }
    results.push({ key, note: typeof note === 'string' ? cleanNote(note) : '' })
  }
  return { results }
}

/** Throws an AiError (never shown to the client) when the provider can't answer. */
export async function askAi(
  rawQuery: string,
  config: AskAiConfig,
): Promise<AiAnswer> {
  if (!config.apiKey) {
    throw new AiError('not configured')
  }
  const model = config.model || DEFAULT_MODEL
  const query = sanitizeQuery(rawQuery).slice(0, MAX_QUERY_LENGTH)
  const start = performance.now()
  const response = await postWithRetry(
    {
      model,
      max_tokens: MAX_TOKENS,
      temperature: 0,
      system: [
        { type: 'text', text: SYSTEM_PROMPT },
        // The catalogue is the same for every query: cached, it costs a tenth of the input price.
        { type: 'text', text: CATALOGUE, cache_control: { type: 'ephemeral' } },
      ],
      messages: [{ role: 'user', content: `<query>${query}</query>` }],
    },
    config,
  )
  const latencyMs = performance.now() - start

  const data = (await response.json().catch(() => null)) as {
    content?: { type?: string; text?: string }[]
    usage?: Record<string, number | undefined>
  } | null
  if (!data) {
    throw new AiError('unreadable response')
  }
  const text = data.content?.find((block) => block.type === 'text')?.text ?? ''
  const tokens = {
    inputTokens: data.usage?.input_tokens ?? 0,
    cacheReadTokens: data.usage?.cache_read_input_tokens ?? 0,
    cacheWriteTokens: data.usage?.cache_creation_input_tokens ?? 0,
    outputTokens: data.usage?.output_tokens ?? 0,
  }
  return {
    ...readAnswer(text),
    usage: { latencyMs, ...tokens, costUsd: costUsd(tokens) },
    model,
    promptVersion: PROMPT_VERSION,
  }
}

export interface HttpReply {
  status: number
  body: unknown
}

/**
 * The endpoint: POST { query } only. Every other field of the body is ignored, the server builds
 * the whole request.
 */
export async function handleAskAiRequest(
  request: { method: string; contentType: string | undefined; body: unknown },
  config: AskAiConfig,
): Promise<HttpReply> {
  if (request.method !== 'POST') {
    return { status: 405, body: { error: MESSAGES.postOnly } }
  }
  // JSON only: a browser must then ask first (CORS preflight), which another site's page can't
  // pass, so it can't make its visitors spend on this endpoint with a plain form post.
  if (!request.contentType?.toLowerCase().startsWith('application/json')) {
    return { status: 415, body: { error: MESSAGES.jsonOnly } }
  }
  if (!config.apiKey) {
    return { status: 503, body: { error: MESSAGES.notConfigured } }
  }
  const raw =
    request.body && typeof request.body === 'object'
      ? (request.body as { query?: unknown }).query
      : undefined
  if (typeof raw !== 'string') {
    return { status: 400, body: { error: MESSAGES.invalidQuery } }
  }
  if (raw.length > MAX_QUERY_LENGTH) {
    return { status: 400, body: { error: MESSAGES.tooLong } }
  }
  const query = sanitizeQuery(raw)
  if (!query) {
    return { status: 400, body: { error: MESSAGES.invalidQuery } }
  }
  try {
    return { status: 200, body: await askAi(query, config) }
  } catch (error) {
    const reason = error instanceof AiError ? error.message : 'unexpected error'
    ;(config.log ?? console.error)(`ask-ai: ${reason}`)
    return { status: 502, body: { error: MESSAGES.unavailable } }
  }
}

/** For the UI to hide the button: says only whether a key is set, never anything about it. */
export function statusReply(apiKey: string | undefined): HttpReply {
  return { status: 200, body: { configured: Boolean(apiKey) } }
}

async function postWithRetry(
  body: unknown,
  config: AskAiConfig,
): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const last = attempt === 1
    let response: Response
    try {
      response = await (config.fetch ?? fetch)(ANTHROPIC_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': config.apiKey ?? '',
          'anthropic-version': ANTHROPIC_VERSION,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      })
    } catch (error) {
      if (last) {
        throw new AiError(
          error instanceof Error && error.name === 'TimeoutError'
            ? 'timeout'
            : 'network error',
        )
      }
      await delay(RETRY_DELAY_MS)
      continue
    }
    if (response.ok) {
      return response
    }
    // The upstream body is never read: it could echo a header or the request.
    await response.body?.cancel().catch(() => {})
    if (last || !RETRYABLE_STATUSES.has(response.status)) {
      throw new AiError(`upstream status ${response.status}`)
    }
    await delay(RETRY_DELAY_MS)
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function parseJsonObject(text: string): unknown {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start < 0 || end <= start) {
    return null
  }
  try {
    return JSON.parse(text.slice(start, end + 1))
  } catch {
    return null
  }
}

function cleanNote(note: string): string {
  return note
    .replace(/[\p{Cc}\p{Cf}]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_NOTE_LENGTH)
}
