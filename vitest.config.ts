/**
 * vitest.config.ts — Vitest configuration for unit tests.
 * Uses @nuxt/test-utils for Nuxt-aware test environment.
 * Tests live in tests/unit/ and follow the *.test.ts naming convention.
 */
import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    // Where to look for test files
    include: ['tests/unit/**/*.test.ts'],
    // Nuxt environment for auto-imports and composables
    environment: 'nuxt',
    // Global test utilities available without importing
    globals: true,
  },
})
