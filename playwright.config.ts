/**
 * playwright.config.ts — Playwright E2E test configuration.
 * Tests live in tests/e2e/ and follow the *.spec.ts naming convention.
 * The dev server must be running before tests (or use webServer option).
 */
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  // Timeout per test
  timeout: 30_000,
  // Run tests in parallel
  fullyParallel: true,
  // Fail the build on test.only in CI
  forbidOnly: !!process.env.CI,
  // Retry failed tests in CI only
  retries: process.env.CI ? 2 : 0,

  use: {
    // Base URL for all tests — allows using relative URLs like page.goto('/login')
    baseURL: 'http://localhost:3000',
    // Capture screenshot on failure for debugging
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Start the Nuxt server before running tests.
  // In CI, use a production build for reliability (dev server has
  // vite-plugin-checker issues). Locally, reuse any running dev server.
  webServer: {
    command: process.env.CI ? 'pnpm build && node .output/server/index.mjs' : 'pnpm dev',
    // Use the auth CSRF endpoint as health check — it always returns 200
    // without triggering auth middleware redirects.
    url: 'http://localhost:3000/api/auth/csrf',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
