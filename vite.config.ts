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
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['tests/**/*.test.ts'],
          exclude: ['tests/queries.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'queries',
          include: ['tests/queries.test.ts'],
        },
      },
    ],
  },
})
