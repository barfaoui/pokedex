// The whole "Ask AI" logic, shared by the serverless function and the Vite dev middleware.
// Server-only: the browser never imports it (the app and the eval page only import its types).
// No imports from src/: the serverless function can't resolve them.
import { CATALOGUE_HEADER, CATALOGUE_LINES } from './catalogue.js'
import { catalogueBlock } from './catalogue-text.js'
import { DEFAULT_CONFIG } from './models.js'
import { costUsd } from './pricing.js'
import { MAX_RESULTS, SYSTEM_PROMPT } from './system-prompt.js'

export { costUsd, USD_TO_EUR } from './pricing.js'

// Bump when the prompt changes, so cached answers and snapshots from an older prompt are told apart.
export const PROMPT_VERSION = 'ask-ai-3'
const MAX_QUERY_LENGTH = 200
// Thinking counts toward it too: at 320, prompt v2 lost 75 of 192 answers to the cut.
const MAX_TOKENS = 1024
// The model can't be prefilled, so the format is enforced instead: nothing comes before the JSON.
const ANSWER_FORMAT = {
  type: 'json_schema',
  schema: {
    type: 'object',
    properties: { results: { type: 'array', items: { type: 'string' } } },
    required: ['results'],
    additionalProperties: false,
  },
}
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

export interface AiUsage {
  latencyMs: number
  inputTokens: number
  cacheReadTokens: number
  cacheWriteTokens: number
  outputTokens: number
  costUsd: number
}

export interface AiAnswer {
  results: string[]
  /** Set when the answer couldn't be read: the results are then empty. */
  note?: string
  stopReason: string | null
  /** Cut at MAX_TOKENS: the results are the keys written before the cut. */
  truncated: boolean
  usage: AiUsage
  model: string
  promptVersion: string
}

export interface AskAiConfig {
  apiKey: string | undefined
  model?: string
  thinking?: 'disabled'
  /** Swapped in tests for a stand-in response. */
  fetch?: typeof fetch
  /** Server logs only: never given a key, a header or an upstream body. */
  log?: (message: string) => void
}

const KNOWN_KEYS: ReadonlySet<string> = new Set(
  CATALOGUE_LINES.map((line) => line.slice(0, line.indexOf(' |'))),
)

const CATALOGUE = catalogueBlock(CATALOGUE_HEADER, CATALOGUE_LINES)

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
 * Only known keys survive, each once, MAX_RESULTS at most. Anything that isn't that shape gives an
 * empty list and a note. A cut answer keeps the keys written in full before the cut.
 */
export function readAnswer(
  text: string,
  truncated = false,
): Pick<AiAnswer, 'results' | 'note'> {
  const listed = truncated ? completeStrings(text) : resultsOf(text)
  // A cut answer without one complete key is as unreadable as broken JSON.
  if (listed === null || (truncated && listed.length === 0)) {
    return { results: [], note: MESSAGES.answerUnavailable }
  }
  const results: string[] = []
  for (const key of listed) {
    if (results.length >= MAX_RESULTS) {
      break
    }
    if (
      typeof key === 'string' &&
      KNOWN_KEYS.has(key) &&
      !results.includes(key)
    ) {
      results.push(key)
    }
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
  const model = config.model || DEFAULT_CONFIG.model
  const query = sanitizeQuery(rawQuery).slice(0, MAX_QUERY_LENGTH)
  const start = performance.now()
  const response = await postWithRetry(
    {
      model,
      max_tokens: MAX_TOKENS,
      output_config: { format: ANSWER_FORMAT },
      ...(config.thinking === 'disabled'
        ? { thinking: { type: 'disabled' } }
        : {}),
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
    stop_reason?: string
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
  const stopReason = data.stop_reason ?? null
  const truncated = stopReason === 'max_tokens'
  return {
    ...readAnswer(text, truncated),
    stopReason,
    truncated,
    usage: { latencyMs, ...tokens, costUsd: costUsd(tokens, model) },
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

/** For the UI: whether a key is set (never anything about it) and the model's name, not a secret. */
export function statusReply(
  apiKey: string | undefined,
  setup: Pick<AskAiConfig, 'model' | 'thinking'>,
): HttpReply {
  return {
    status: 200,
    body: {
      configured: Boolean(apiKey),
      model: setup.model || DEFAULT_CONFIG.model,
      thinking: setup.thinking ?? 'default',
    },
  }
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

function resultsOf(text: string): unknown[] | null {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start < 0 || end <= start) {
    return null
  }
  try {
    const parsed: unknown = JSON.parse(text.slice(start, end + 1))
    const results = (parsed as { results?: unknown } | null)?.results
    return Array.isArray(results) ? results : null
  } catch {
    return null
  }
}

// The last key of a cut answer has no closing quote, so it doesn't match.
function completeStrings(text: string): string[] {
  const start = text.indexOf('[')
  if (start < 0) {
    return []
  }
  return [...text.slice(start).matchAll(/"(?:[^"\\]|\\.)*"/g)].map(
    ([quoted]) => JSON.parse(quoted) as string,
  )
}
