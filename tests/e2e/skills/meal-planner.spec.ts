/**
 * tests/e2e/skills/meal-planner.spec.ts — E2E happy path for the Meal Planner skill.
 * Registers a fresh user, creates a recipe with one ingredient via the modal,
 * verifies it appears in the recipe grid, then pushes its ingredient to the
 * grocery list and verifies the grocery list contains the item.
 */
import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

let testCounter = 0;

async function registerAndLogin(page: import('@playwright/test').Page, baseURL: string) {
  testCounter++;
  const email = `test-meal-${Date.now()}-${testCounter}@example.com`;
  const password = 'testpassword123';

  const regResponse = await page.request.post(`${baseURL}/api/auth/register`, {
    data: { email, password, name: 'Test User' },
  });
  expect(regResponse.ok()).toBeTruthy();

  await page.goto('/login');

  const csrfToken = await page.evaluate(async (url) => {
    const res = await fetch(`${url}/api/auth/csrf`);
    const data = await res.json();
    return data.csrfToken;
  }, baseURL);

  await page.evaluate(
    async ({ url, email: e, password: p, csrf }) => {
      await fetch(`${url}/api/auth/callback/credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ email: e, password: p, csrfToken: csrf, json: 'true' }),
        redirect: 'follow',
      });
    },
    { url: baseURL, email, password, csrf: csrfToken },
  );

  await page.goto('/dashboard');
  await expect(page.getByTestId('dashboard-title')).toBeVisible({ timeout: 10_000 });
  return email;
}

test.describe('Meal Planner Skill', () => {
  test('creates a recipe and pushes its ingredients to the grocery list', async ({
    page,
    baseURL,
  }) => {
    await registerAndLogin(page, baseURL!);
    await page.goto('/skills/meal-planner');

    // Empty state.
    await expect(page.getByText("Aucune recette pour l'instant", { exact: false })).toBeVisible();

    // Open the create modal.
    await page.getByTestId('recipe-create').click();
    await expect(page.getByTestId('recipe-modal')).toBeVisible();

    // Fill the recipe.
    await page.getByTestId('recipe-name-input').fill('Salade César');
    // Fill the first ingredient row (the modal pre-creates one empty row).
    await page.getByPlaceholder('Nom').first().fill('Salade');
    await page.getByPlaceholder('Qté').first().fill('1');
    await page.getByPlaceholder('Unité').first().fill('pièce');

    // Save.
    await page.getByTestId('recipe-save').click();

    // The recipe card appears in the grid.
    await expect(page.getByText('Salade César')).toBeVisible({ timeout: 5_000 });

    // Push to grocery list — fires an alert; auto-dismiss it.
    page.once('dialog', (dialog) => dialog.accept());
    await page
      .getByTestId(/^recipe-push-to-grocery-/)
      .first()
      .click();

    // Hop to the Grocery List page; wait for the items API to settle before
    // asserting — without that, the page can render its empty state first
    // and the text assertion races against it.
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/api/skills/grocery/items') && r.request().method() === 'GET',
      ),
      page.goto('/skills/grocery-list'),
    ]);
    await expect(page.getByText('Salade')).toBeVisible({ timeout: 10_000 });
  });

  test('renders the weekly planner grid with all meal type rows', async ({
    page,
    baseURL,
  }) => {
    await registerAndLogin(page, baseURL!);
    await page.goto('/skills/meal-planner');
    await page.getByTestId('tab-planner').click();

    // Every meal-type label should be visible on the planner. `exact: true`
    // is required because "Déjeuner" is a substring of "Petit-déjeuner" —
    // the default substring match would pick up both and fail strict mode.
    await expect(page.getByText('Petit-déjeuner', { exact: true })).toBeVisible();
    await expect(page.getByText('Déjeuner', { exact: true })).toBeVisible();
    await expect(page.getByText('Dîner', { exact: true })).toBeVisible();
    await expect(page.getByText('Collation', { exact: true })).toBeVisible();

    // Week navigation buttons are wired.
    await expect(page.getByTestId('week-previous')).toBeVisible();
    await expect(page.getByTestId('week-next')).toBeVisible();
    await expect(page.getByTestId('week-current')).toBeVisible();
  });
});
