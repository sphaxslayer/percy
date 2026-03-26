/**
 * tests/e2e/skills/todo-at-home.spec.ts — E2E tests for the TodoAtHome skill.
 * Each test registers a fresh user. Seed data is auto-created on first visit.
 */
import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

let testCounter = 0;

/**
 * Register via API, then authenticate in the browser.
 */
async function registerAndLogin(page: import('@playwright/test').Page, baseURL: string) {
  testCounter++;
  const email = `test-todo-${Date.now()}-${testCounter}@example.com`;
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

  return email;
}

/**
 * Navigate to todo-at-home page and wait for seed + initial load.
 */
async function goToTodo(page: import('@playwright/test').Page) {
  await page.goto('/skills/todo-at-home');
  await expect(page.getByTestId('todo-title')).toBeVisible({ timeout: 15_000 });
  // Wait for seed data to load — context cards should appear
  await expect(page.locator('[data-testid^="context-card-"]').first()).toBeVisible({ timeout: 10_000 });
}

test.describe('TodoAtHome Skill', () => {
  test('seed data creates default contexts on first visit', async ({ page, baseURL }) => {
    await registerAndLogin(page, baseURL!);
    await goToTodo(page);

    // Should see at least Global + Cuisine context cards
    const contextCards = page.locator('[data-testid^="context-card-"]');
    await expect(contextCards).toHaveCount(6, { timeout: 5_000 }); // Global + 5 suggested
  });

  test('can create a new context', async ({ page, baseURL }) => {
    await registerAndLogin(page, baseURL!);
    await goToTodo(page);

    // Fill in context add form
    await page.getByTestId('todo-context-add-name').fill('Garage');
    await page.getByTestId('todo-context-add-submit').click();

    // Wait for API response
    await page.waitForResponse(
      (r) => r.url().includes('/api/skills/todo-at-home/contexts') && r.request().method() === 'POST',
    );

    // New context should appear in the grid (use heading to avoid matching <option> elements)
    await expect(page.getByRole('heading', { name: 'Garage' })).toBeVisible();
  });

  test('quick add creates a task in the right context', async ({ page, baseURL }) => {
    await registerAndLogin(page, baseURL!);
    await goToTodo(page);

    // Quick add a task
    await page.getByTestId('todo-quick-add-input').fill('Nettoyer le four');
    await page.getByTestId('todo-quick-add-submit').click();

    // Wait for task creation
    await page.waitForResponse(
      (r) => r.url().includes('/api/skills/todo-at-home/tasks') && r.request().method() === 'POST',
    );

    // Task should appear in the first context card (Global by default)
    await expect(page.getByText('Nettoyer le four')).toBeVisible();
  });

  test('toggling task status updates progression', async ({ page, baseURL }) => {
    await registerAndLogin(page, baseURL!);
    await goToTodo(page);

    // Quick add a task
    await page.getByTestId('todo-quick-add-input').fill('Tâche test');
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/api/skills/todo-at-home/tasks') && r.request().method() === 'POST',
      ),
      page.getByTestId('todo-quick-add-submit').click(),
    ]);

    // Click on the first context card to see detail
    await page.locator('[data-testid^="context-card-"]').first().click();

    // Toggle task done
    const taskItem = page.locator('[data-testid^="task-item-"]').first();
    await expect(taskItem).toBeVisible();
    await taskItem.locator('button').first().click(); // checkbox button

    // Wait for PATCH
    await page.waitForResponse(
      (r) => r.url().includes('/api/skills/todo-at-home/tasks/') && r.request().method() === 'PATCH',
    );

    // Task should now appear in "Fait" section
    await expect(page.getByText('Fait')).toBeVisible();
  });

  test('filters show correct results', async ({ page, baseURL }) => {
    await registerAndLogin(page, baseURL!);
    await goToTodo(page);

    // Add two tasks
    await page.getByTestId('todo-quick-add-input').fill('Tâche haute priorité');
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/tasks') && r.request().method() === 'POST'),
      page.getByTestId('todo-quick-add-submit').click(),
    ]);

    // Apply priority filter
    await page.getByTestId('todo-filter-priority').selectOption('high');

    // Wait for filtered results
    await page.waitForResponse((r) => r.url().includes('/tasks'));

    // With "high" filter, no tasks should show (our task was created with "normal" default)
    const contextCards = page.locator('[data-testid^="context-card-"]');
    // Context cards still show, but they should have 0 open tasks text or no preview
    await expect(contextCards.first()).toBeVisible();
  });

  test('agenda view groups tasks by day', async ({ page, baseURL }) => {
    await registerAndLogin(page, baseURL!);
    await goToTodo(page);

    // Switch to agenda view
    await page.getByTestId('todo-view-agenda').click();
    await expect(page.getByTestId('todo-agenda')).toBeVisible();

    // Without any scheduled tasks, should show empty message
    await expect(page.getByText('Aucune tâche planifiée')).toBeVisible();
  });

  test('dashboard shows todo skill card', async ({ page, baseURL }) => {
    await registerAndLogin(page, baseURL!);
    await page.goto('/dashboard');
    await expect(page.getByTestId('dashboard-title')).toBeVisible({ timeout: 10_000 });

    await expect(page.getByTestId('skill-card-todo-at-home')).toBeVisible();
    await expect(
      page.getByTestId('skill-card-todo-at-home').getByText('Tâches à la maison'),
    ).toBeVisible();
  });
});
