/**
 * tests/e2e/auth.spec.ts — E2E tests for authentication pages.
 * Verifies that the login and register pages load correctly.
 */
import { test, expect } from '@playwright/test'

test.describe('Authentication pages', () => {
  test('login page loads with form', async ({ page }) => {
    await page.goto('/login')

    // Verify the page title/heading is present
    await expect(page.getByText('Connexion')).toBeVisible()

    // Verify form elements are present
    await expect(page.getByTestId('email')).toBeVisible()
    await expect(page.getByTestId('password')).toBeVisible()
    await expect(page.getByTestId('login-button')).toBeVisible()

    // Verify link to register page
    await expect(page.getByText('Créer un compte')).toBeVisible()
  })

  test('register page loads with form', async ({ page }) => {
    await page.goto('/register')

    // Verify the page heading
    await expect(page.getByText('Créer un compte')).toBeVisible()

    // Verify form elements
    await expect(page.getByTestId('name')).toBeVisible()
    await expect(page.getByTestId('email')).toBeVisible()
    await expect(page.getByTestId('password')).toBeVisible()
    await expect(page.getByTestId('confirm-password')).toBeVisible()
    await expect(page.getByTestId('register-button')).toBeVisible()

    // Verify link to login page
    await expect(page.getByText('Se connecter')).toBeVisible()
  })

  test('unauthenticated user is redirected from dashboard to login', async ({ page }) => {
    await page.goto('/dashboard')

    // Should redirect to login page
    await page.waitForURL(/\/login/)
    await expect(page.getByTestId('login-button')).toBeVisible()
  })
})
