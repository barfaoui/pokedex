/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const src = fileURLToPath(new URL('./src', import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': src },
  },
  css: {
    preprocessorOptions: {
      scss: { loadPaths: [src] },
    },
  },
  test: {
    // Vitest runs tests/**/*.test.ts; Playwright runs tests/e2e/*.spec.ts.
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
            'tests/eval/**',
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
