/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // Vitest runs tests/**/*.test.ts; Playwright runs tests/e2e/*.spec.ts.
    // The PRD queries are their own project so they don't block CI until they all pass.
    projects: [
      {
        test: {
          name: 'unit',
          include: ['tests/**/*.test.ts'],
          exclude: ['tests/queries.test.ts'],
        },
      },
      {
        test: {
          name: 'queries',
          include: ['tests/queries.test.ts'],
        },
      },
    ],
  },
})
