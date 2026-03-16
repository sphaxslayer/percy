/**
 * vitest.config.server.ts — Plain Node config for server/API route tests.
 * No Nuxt environment — uses manual mocking for Nitro globals.
 * The ~/server alias maps to the project root server/ directory.
 */
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      '~/server': fileURLToPath(new URL('./server', import.meta.url)),
    },
  },
})
