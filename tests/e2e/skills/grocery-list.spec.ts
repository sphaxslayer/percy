/**
 * tests/e2e/skills/grocery-list.spec.ts — E2E tests for the Grocery List skill.
 * Tests the main user flows: adding items, checking off, clearing checked items.
 * Each test registers a fresh user to avoid state leakage between tests.
 */
import { test, expect } from '@playwright/test'

/** Register a new user and log in. Returns the unique email for the test. */
async function registerAndLogin(page: import('@playwright/test').Page) {
  const email = `test-grocery-${Date.now()}@example.com`
  const password = 'testpassword123'

  // Register
  await page.goto('/register')
  await page.getByTestId('name').fill('Test User')
  await page.getByTestId('email').fill(email)
  await page.getByTestId('password').fill(password)
  await page.getByTestId('confirm-password').fill(password)
  await page.getByTestId('register-button').click()
  await page.waitForURL(/\/login/)

  // Login
  await page.getByTestId('email').fill(email)
  await page.getByTestId('password').fill(password)
  await page.getByTestId('login-button').click()
  await page.waitForURL(/\/dashboard/)

  return email
}

test.describe('Grocery List Skill', () => {
  test('can add an item to the list', async ({ page }) => {
    await registerAndLogin(page)
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

  test('can add an item with quantity parsing', async ({ page }) => {
    await registerAndLogin(page)
    await page.goto('/skills/grocery-list')

    // Add item with quantity syntax "Bananes x6"
    await page.getByTestId('grocery-add-input').fill('Bananes x6')
    await page.getByTestId('grocery-add-button').click()

    // Item should appear with quantity
    await expect(page.getByText('Bananes')).toBeVisible()
    await expect(page.getByText('× 6')).toBeVisible()
  })

  test('can check off an item', async ({ page }) => {
    await registerAndLogin(page)
    await page.goto('/skills/grocery-list')

    // Add an item
    await page.getByTestId('grocery-add-input').fill('Lait')
    await page.getByTestId('grocery-add-button').click()
    await expect(page.getByText('Lait')).toBeVisible()

    // Find the checkbox and check it — the item row uses dynamic testid with the item's ID,
    // so we target the checkbox within the visible item row
    const itemRow = page.locator('[data-testid^="grocery-item-"]').first()
    const checkbox = itemRow.locator('[data-testid^="grocery-checkbox-"]')
    await checkbox.click()

    // The "Déjà acheté" section should now appear with a count badge
    await expect(page.getByTestId('grocery-checked-toggle')).toBeVisible()
    await expect(page.getByTestId('grocery-checked-toggle')).toContainText('1')
  })

  test('can expand checked section and uncheck an item', async ({ page }) => {
    await registerAndLogin(page)
    await page.goto('/skills/grocery-list')

    // Add and check an item
    await page.getByTestId('grocery-add-input').fill('Pain')
    await page.getByTestId('grocery-add-button').click()
    await expect(page.getByText('Pain')).toBeVisible()

    const checkbox = page.locator('[data-testid^="grocery-checkbox-"]').first()
    await checkbox.click()

    // Expand checked section
    await page.getByTestId('grocery-checked-toggle').click()

    // Item should be visible in the checked section with strikethrough
    const checkedItem = page.locator('[data-testid^="grocery-item-"]').first()
    await expect(checkedItem).toBeVisible()

    // Uncheck it — click the checkbox again
    const uncheckedBox = checkedItem.locator('[data-testid^="grocery-checkbox-"]')
    await uncheckedBox.click()

    // The checked section should disappear (no more checked items)
    await expect(page.getByTestId('grocery-checked-toggle')).not.toBeVisible()

    // Item should be back in the active list
    await expect(page.getByText('Pain')).toBeVisible()
  })

  test('can clear all checked items with confirmation', async ({ page }) => {
    await registerAndLogin(page)
    await page.goto('/skills/grocery-list')

    // Add two items
    await page.getByTestId('grocery-add-input').fill('Oeufs')
    await page.getByTestId('grocery-add-button').click()
    await expect(page.getByText('Oeufs')).toBeVisible()

    await page.getByTestId('grocery-add-input').fill('Beurre')
    await page.getByTestId('grocery-add-button').click()
    await expect(page.getByText('Beurre')).toBeVisible()

    // Check both items
    const checkboxes = page.locator('[data-testid^="grocery-checkbox-"]')
    await checkboxes.nth(0).click()
    // Wait for the first check to register before clicking the second
    await expect(page.getByTestId('grocery-checked-toggle')).toBeVisible()
    await checkboxes.nth(0).click()

    // Click "Vider" button
    await page.getByTestId('grocery-clear-button').click()

    // Confirmation should appear
    await expect(page.getByText('Supprimer tout ?')).toBeVisible()

    // Confirm
    await page.getByTestId('grocery-clear-confirm').click()

    // Checked section should be gone, list should be empty
    await expect(page.getByTestId('grocery-checked-toggle')).not.toBeVisible()
    await expect(page.getByTestId('grocery-empty')).toBeVisible()
  })

  test('can submit item with Enter key', async ({ page }) => {
    await registerAndLogin(page)
    await page.goto('/skills/grocery-list')

    // Type and press Enter
    await page.getByTestId('grocery-add-input').fill('Tomates')
    await page.getByTestId('grocery-add-input').press('Enter')

    // Item should appear
    await expect(page.getByText('Tomates')).toBeVisible()
  })

  test('add button is disabled when input is empty', async ({ page }) => {
    await registerAndLogin(page)
    await page.goto('/skills/grocery-list')

    // Button should be disabled with empty input
    await expect(page.getByTestId('grocery-add-button')).toBeDisabled()
  })

  test('dashboard shows grocery skill card', async ({ page }) => {
    await registerAndLogin(page)

    // Dashboard should show the grocery skill card
    await expect(page.getByTestId('skill-card-grocery-list')).toBeVisible()
    await expect(page.getByText('Liste de courses')).toBeVisible()
  })

  test('dashboard grocery card links to skill page', async ({ page }) => {
    await registerAndLogin(page)

    // Click the grocery card
    await page.getByTestId('skill-card-grocery-list').click()

    // Should navigate to the grocery list page
    await page.waitForURL(/\/skills\/grocery-list/)
    await expect(page.getByTestId('grocery-title')).toBeVisible()
  })
})
