// Vercel serverless function: POST /api/ask-ai with { "query": "…" }.
import type { IncomingMessage, ServerResponse } from 'node:http'
import { handleAskAiRequest } from './_lib/ask-ai.js'
import { readJsonBody, sendReply } from './_lib/node-http.js'

export default async function handler(
  request: IncomingMessage & { body?: unknown },
  response: ServerResponse,
): Promise<void> {
  const body =
    request.method === 'POST' ? await readJsonBody(request) : undefined
  sendReply(
    response,
    await handleAskAiRequest(
      {
        method: request.method ?? '',
        contentType: request.headers['content-type'],
        body,
      },
      {
        apiKey: process.env.ANTHROPIC_API_KEY,
        model: process.env.AI_MODEL,
      },
    ),
  )
}
