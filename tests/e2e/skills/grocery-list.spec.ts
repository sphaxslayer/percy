/**
 * tests/e2e/skills/grocery-list.spec.ts — E2E tests for the Grocery List skill.
 * Tests the main user flows: adding items, checking off, clearing checked items.
 * Each test registers a fresh user to avoid state leakage between tests.
 */
import { test, expect } from '@playwright/test'

// Run grocery tests serially — each registers a user and hits the same DB
test.describe.configure({ mode: 'serial' })

let testCounter = 0

/**
 * Register via API, then login via the login page form.
 * Uses force:true on click to bypass hydration stability issues in CI.
 */
async function registerAndLogin(page: import('@playwright/test').Page, baseURL: string) {
  testCounter++
  const email = `test-grocery-${Date.now()}-${testCounter}@example.com`
  const password = 'testpassword123'

  // Register via API
  const regResponse = await page.request.post(`${baseURL}/api/auth/register`, {
    data: { email, password, name: 'Test User' },
  })
  expect(regResponse.ok()).toBeTruthy()

  // Navigate to login — use 'load' and then wait for hydration
  await page.goto('/login')

  // Wait for Vue hydration: the login button becomes enabled only after Vue mounts
  const loginButton = page.getByTestId('login-button')
  await expect(loginButton).toBeEnabled({ timeout: 10_000 })

  // Use type() instead of fill() to simulate real keyboard input
  await page.getByTestId('email').click()
  await page.getByTestId('email').type(email)
  await page.getByTestId('password').click()
  await page.getByTestId('password').type(password)

  // Click login and wait for navigation
  await loginButton.click({ timeout: 10_000 })
  await page.waitForURL(/\/dashboard/, { timeout: 20_000 })

  return email
}

test.describe('Grocery List Skill', () => {
  test('can add an item to the list', async ({ page, baseURL }) => {
    await registerAndLogin(page, baseURL!)
    await page.goto('/skills/grocery-list')

    // Verify the page loaded
    await expect(page.getByTestId('grocery-title')).toBeVisible()

    // Verify empty state
    await expect(page.getByTestId('grocery-empty')).toBeVisible()

    // Add an item
    await page.getByTestId('grocery-add-input').fill('Bananes')
    await page.getByTestId('grocery-add-button').click()

    // Item should appear in the list
    await expect(page.getByText('Bananes')).toBeVisible()

    // Empty state should be gone
    await expect(page.getByTestId('grocery-empty')).not.toBeVisible()
  })

  test('can add an item with quantity parsing', async ({ page, baseURL }) => {
    await registerAndLogin(page, baseURL!)
    await page.goto('/skills/grocery-list')

    await page.getByTestId('grocery-add-input').fill('Bananes x6')
    await page.getByTestId('grocery-add-button').click()

    await expect(page.getByText('Bananes')).toBeVisible()
    await expect(page.getByText('× 6')).toBeVisible()
  })

  test('can check off an item', async ({ page, baseURL }) => {
    await registerAndLogin(page, baseURL!)
    await page.goto('/skills/grocery-list')

    await page.getByTestId('grocery-add-input').fill('Lait')
    await page.getByTestId('grocery-add-button').click()
    await expect(page.getByText('Lait')).toBeVisible()

    const itemRow = page.locator('[data-testid^="grocery-item-"]').first()
    const checkbox = itemRow.locator('[data-testid^="grocery-checkbox-"]')
    await checkbox.click()

    await expect(page.getByTestId('grocery-checked-toggle')).toBeVisible()
    await expect(page.getByTestId('grocery-checked-toggle')).toContainText('1')
  })

  test('can expand checked section and uncheck an item', async ({ page, baseURL }) => {
    await registerAndLogin(page, baseURL!)
    await page.goto('/skills/grocery-list')

    await page.getByTestId('grocery-add-input').fill('Pain')
    await page.getByTestId('grocery-add-button').click()
    await expect(page.getByText('Pain')).toBeVisible()

    const checkbox = page.locator('[data-testid^="grocery-checkbox-"]').first()
    await checkbox.click()

    await page.getByTestId('grocery-checked-toggle').click()

    const checkedItem = page.locator('[data-testid^="grocery-item-"]').first()
    await expect(checkedItem).toBeVisible()

    const uncheckedBox = checkedItem.locator('[data-testid^="grocery-checkbox-"]')
    await uncheckedBox.click()

    await expect(page.getByTestId('grocery-checked-toggle')).not.toBeVisible()
    await expect(page.getByText('Pain')).toBeVisible()
  })

  test('can clear all checked items with confirmation', async ({ page, baseURL }) => {
    await registerAndLogin(page, baseURL!)
    await page.goto('/skills/grocery-list')

    await page.getByTestId('grocery-add-input').fill('Oeufs')
    await page.getByTestId('grocery-add-button').click()
    await expect(page.getByText('Oeufs')).toBeVisible()

    await page.getByTestId('grocery-add-input').fill('Beurre')
    await page.getByTestId('grocery-add-button').click()
    await expect(page.getByText('Beurre')).toBeVisible()

    const checkboxes = page.locator('[data-testid^="grocery-checkbox-"]')
    await checkboxes.nth(0).click()
    await expect(page.getByTestId('grocery-checked-toggle')).toBeVisible()
    await checkboxes.nth(0).click()

    await page.getByTestId('grocery-clear-button').click()
    await expect(page.getByText('Supprimer tout ?')).toBeVisible()
    await page.getByTestId('grocery-clear-confirm').click()

    await expect(page.getByTestId('grocery-checked-toggle')).not.toBeVisible()
    await expect(page.getByTestId('grocery-empty')).toBeVisible()
  })

  test('can submit item with Enter key', async ({ page, baseURL }) => {
    await registerAndLogin(page, baseURL!)
    await page.goto('/skills/grocery-list')

    await page.getByTestId('grocery-add-input').fill('Tomates')
    await page.getByTestId('grocery-add-input').press('Enter')

    await expect(page.getByText('Tomates')).toBeVisible()
  })

  test('add button is disabled when input is empty', async ({ page, baseURL }) => {
    await registerAndLogin(page, baseURL!)
    await page.goto('/skills/grocery-list')

    await expect(page.getByTestId('grocery-add-button')).toBeDisabled()
  })

  test('dashboard shows grocery skill card', async ({ page, baseURL }) => {
    await registerAndLogin(page, baseURL!)
    await page.goto('/dashboard')

    await expect(page.getByTestId('skill-card-grocery-list')).toBeVisible()
    await expect(page.getByText('Liste de courses')).toBeVisible()
  })

  test('dashboard grocery card links to skill page', async ({ page, baseURL }) => {
    await registerAndLogin(page, baseURL!)
    await page.goto('/dashboard')

    await page.getByTestId('skill-card-grocery-list').click()
    await page.waitForURL(/\/skills\/grocery-list/)
    await expect(page.getByTestId('grocery-title')).toBeVisible()
  })
})
