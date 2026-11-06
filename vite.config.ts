/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import { handleAskAiRequest, statusReply } from './api/_lib/ask-ai.ts'
import { readJsonBody, sendReply } from './api/_lib/node-http.ts'

const src = fileURLToPath(new URL('./src', import.meta.url))

// `npm run dev` answers /api/ask-ai like the Vercel function, with the key from .env.local. The key
// stays in this server process: only VITE_ variables ever reach the browser.
function askAiDevServer(): Plugin {
  return {
    name: 'ask-ai-dev-server',
    apply: 'serve',
    configureServer(server) {
      const env = loadEnv(server.config.mode, process.cwd(), '')
      server.middlewares.use('/api/ask-ai-status', (_request, response) =>
        sendReply(response, statusReply(env.ANTHROPIC_API_KEY, env.AI_MODEL)),
      )
      server.middlewares.use('/api/ask-ai', async (request, response) => {
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
            { apiKey: env.ANTHROPIC_API_KEY, model: env.AI_MODEL },
          ),
        )
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), askAiDevServer()],
  resolve: {
    alias: { '@': src },
  },
  css: {
    preprocessorOptions: {
      scss: { loadPaths: [src] },
    },
  },
  build: {
    // The app, and the eval page served at /eval (vercel.json cleanUrls).
    rolldownOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        eval: fileURLToPath(new URL('./eval.html', import.meta.url)),
      },
    },
  },
  test: {
    // The PRD queries are their own project (npm run test:queries), a separate CI step.
    // The search evaluation (npm run eval) only reports, so it stays out of CI.
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['tests/**/*.test.ts'],
          exclude: [
            'tests/queries.test.ts',
            'tests/semantic.test.ts',
            'tests/eval/eval.test.ts',
          ],
        },
      },
      {
        extends: true,
        test: {
          name: 'queries',
          include: ['tests/queries.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'semantic',
          include: ['tests/semantic.test.ts'],
          testTimeout: 60_000,
          hookTimeout: 120_000,
        },
      },
      {
        extends: true,
        test: {
          name: 'eval',
          include: ['tests/eval/eval.test.ts'],
        },
      },
    ],
  },
})
