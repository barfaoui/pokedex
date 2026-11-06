// Node request plumbing shared by the serverless functions and the Vite dev middleware.
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { HttpReply } from './ask-ai.js'

// A query is 200 characters at most: anything far larger isn't a search.
const MAX_BODY_BYTES = 4096

/** The parsed JSON body, or undefined when it isn't JSON or is too large. */
export async function readJsonBody(
  request: IncomingMessage & { body?: unknown },
): Promise<unknown> {
  // Vercel parses JSON bodies itself, and throws on reading an invalid one.
  try {
    if (request.body !== undefined) {
      return typeof request.body === 'string'
        ? parseJson(request.body)
        : request.body
    }
  } catch {
    return undefined
  }
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of request) {
    size += (chunk as Buffer).length
    if (size > MAX_BODY_BYTES) {
      return undefined
    }
    chunks.push(chunk as Buffer)
  }
  return parseJson(Buffer.concat(chunks).toString('utf8'))
}

export function sendReply(response: ServerResponse, reply: HttpReply): void {
  response.statusCode = reply.status
  response.setHeader('content-type', 'application/json; charset=utf-8')
  response.setHeader('cache-control', 'no-store')
  response.end(JSON.stringify(reply.body))
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}
