/**
 * vitest.config.ts — Vitest configuration for unit tests.
 * Uses vitest projects to separate frontend (nuxt env) and server (node env) tests.
 */
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    projects: [
      // Frontend tests — Vue components, composables (needs Nuxt environment)
      {
        extends: './vitest.config.nuxt.ts',
        test: {
          name: 'frontend',
          include: ['tests/unit/**/*.test.ts'],
          exclude: ['tests/unit/**/*-api.test.ts'],
        },
      },
      // Server tests — API routes (plain Node environment, no Nuxt aliases)
      {
        extends: './vitest.config.server.ts',
        test: {
          name: 'server',
          include: ['tests/unit/**/*-api.test.ts'],
        },
      },
    ],
  },
})
