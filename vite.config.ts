/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // Unit tests live next to the code; end-to-end tests (tests/e2e) are run by Playwright
    include: ['src/**/*.test.ts'],
  },
})
