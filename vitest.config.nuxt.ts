/**
 * vitest.config.nuxt.ts — Nuxt-aware config for frontend tests.
 * Provides Vue component support, auto-imports, and composable mocking.
 */
import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    environment: 'nuxt',
    globals: true,
  },
})
