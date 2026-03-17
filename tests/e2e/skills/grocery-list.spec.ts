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

  // Navigate to login page first to establish the browser context origin
  await page.goto('/login')

  // Authenticate by making fetch calls directly in the browser.
  // This sets the session cookie in the browser context.
  const csrfToken = await page.evaluate(async (url) => {
    const res = await fetch(`${url}/api/auth/csrf`)
    const data = await res.json()
    return data.csrfToken
  }, baseURL)

  // Submit credentials via browser fetch to set session cookie
  await page.evaluate(
    async ({ url, email: e, password: p, csrf }) => {
      await fetch(`${url}/api/auth/callback/credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ email: e, password: p, csrfToken: csrf, json: 'true' }),
        redirect: 'follow',
      })
    },
    { url: baseURL, email, password, csrf: csrfToken },
  )

  // Now the session cookie is set in the browser — navigate to dashboard
  await page.goto('/dashboard')
  await expect(page.getByTestId('dashboard-title')).toBeVisible({ timeout: 10_000 })

  return email
}

test.describe('Grocery List Skill', () => {
  test('can add an item to the list', async ({ page, baseURL }) => {
    await registerAndLogin(page, baseURL!)
    await page.goto('/skills/grocery-list')

    // Debug: check what's on the page
    const currentUrl = page.url()
    if (!currentUrl.includes('grocery')) {
      throw new Error(`Expected grocery page, but at: ${currentUrl}`)
    }

    // Wait for hydration
    await page.waitForFunction(
      () => (document.querySelector('#__nuxt') as HTMLElement | null)?.__vue_app__ !== undefined,
      { timeout: 15_000 },
    )

    // Verify the page loaded
    await expect(page.getByTestId('grocery-title')).toBeVisible({ timeout: 10_000 })

    // Debug: check what testid elements exist on the page
    const testids = await page.evaluate(() =>
      Array.from(document.querySelectorAll('[data-testid]')).map(
        (el) => `${el.tagName}[${el.getAttribute('data-testid')}]`,
      ),
    )
    // eslint-disable-next-line no-console
    console.log('Found data-testid elements:', testids)

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
