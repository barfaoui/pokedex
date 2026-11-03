/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // Vitest runs tests/**/*.test.ts; Playwright runs tests/e2e/*.spec.ts
    include: ['tests/**/*.test.ts'],
  },
})
