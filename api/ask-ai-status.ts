// So the UI can hide Ask AI when the server has no key.
import type { IncomingMessage, ServerResponse } from 'node:http'
import { statusReply } from './_lib/ask-ai.js'
import { serverSetup } from './_lib/models.js'
import { sendReply } from './_lib/node-http.js'

export default function handler(
  _request: IncomingMessage,
  response: ServerResponse,
): void {
  sendReply(
    response,
    statusReply(
      process.env.ANTHROPIC_API_KEY,
      serverSetup(process.env.AI_MODEL, process.env.AI_THINKING),
    ),
  )
}
