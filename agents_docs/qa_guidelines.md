# QA Guidelines — Testing & Quality Assurance

## Role Context
When Claude reads this file, it should think as a **QA Engineer**.
Focus: test coverage, reliability, catching regressions, validating user flows.

## Testing Stack
- **Unit tests**: Vitest (fast, native ESM, Vue Test Utils compatible)
- **E2E tests**: Playwright (cross-browser, reliable for web apps)
- **Test runner**: `pnpm test` runs both, `pnpm test:unit` / `pnpm test:e2e` for individual

## Unit Testing (Vitest)

### What to Unit Test
- Composables (business logic, state management)
- Utility functions
- API route handlers (mock Prisma + session)
- Pinia stores
- Individual components (when they have non-trivial logic)

### What NOT to Unit Test
- Template rendering with no logic (just layout)
- Third-party library internals
- CSS / styling

### Structure
```
tests/unit/
├── composables/
│   └── use-todo-list.test.ts
├── server/
│   └── api/skills/todos/
│       ├── index.post.test.ts
│       └── [id].patch.test.ts
└── components/
    └── skills/todos/
        └── todo-item.test.ts
```

### Composable Test Example
```typescript
// tests/unit/composables/use-todo-list.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useTodoList } from '~/composables/use-todo-list'

// Mock $fetch globally
vi.mock('#app', () => ({
  $fetch: vi.fn()
}))

describe('useTodoList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches todos and updates state', async () => {
    const mockTodos = [
      { id: '1', title: 'Test', completed: false }
    ]
    vi.mocked($fetch).mockResolvedValueOnce(mockTodos)

    const { todos, fetchTodos, loading } = useTodoList()

    expect(loading.value).toBe(false)
    await fetchTodos()
    expect(todos.value).toEqual(mockTodos)
  })

  it('computes completed count correctly', () => {
    const { todos, completedCount } = useTodoList()
    todos.value = [
      { id: '1', title: 'A', completed: true },
      { id: '2', title: 'B', completed: false },
      { id: '3', title: 'C', completed: true },
    ]
    expect(completedCount.value).toBe(2)
  })
})
```

### API Route Test Example
```typescript
// tests/unit/server/api/skills/todos/index.post.test.ts
import { describe, it, expect, vi } from 'vitest'

// Mock Prisma
vi.mock('~/server/utils/prisma', () => ({
  prisma: {
    skillTodo: {
      create: vi.fn(),
    }
  }
}))

describe('POST /api/skills/todos', () => {
  it('rejects unauthenticated requests', async () => {
    // ... test 401 response
  })

  it('validates input', async () => {
    // ... test 400 with invalid data
  })

  it('creates a todo for authenticated user', async () => {
    // ... test 201 with valid data
  })
})
```

## E2E Testing (Playwright)

### What to E2E Test
- Critical user flows (login, navigate to skill, use skill, verify result)
- Each skill's primary happy path
- Authentication flow
- Responsive layout on mobile viewport

### Structure
```
tests/e2e/
├── auth.spec.ts
├── dashboard.spec.ts
└── skills/
    └── todo-list.spec.ts
```

### E2E Test Example
```typescript
// tests/e2e/skills/todo-list.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Todo List Skill', () => {
  test.beforeEach(async ({ page }) => {
    // Login (use a test helper or seed a test user)
    await page.goto('/login')
    await page.fill('[data-testid="email"]', 'test@example.com')
    await page.fill('[data-testid="password"]', 'testpassword')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')
  })

  test('can add and complete a todo', async ({ page }) => {
    await page.goto('/skills/todo-list')

    // Add a todo
    await page.fill('[data-testid="todo-input"]', 'Buy groceries')
    await page.click('[data-testid="add-todo"]')

    // Verify it appears
    await expect(page.getByText('Buy groceries')).toBeVisible()

    // Complete it
    await page.click('[data-testid="todo-checkbox-0"]')

    // Verify completion state
    await expect(page.getByTestId('todo-item-0')).toHaveClass(/completed/)
  })
})
```

## Quality Checklist (Before Every PR)

1. `pnpm lint` passes (0 errors)
2. `pnpm test:unit` passes (0 failures)
3. `pnpm test:e2e` passes (0 failures)
4. No TypeScript `any` without justification comment
5. New code has test coverage (unit at minimum)
6. API routes validate input with Zod
7. API routes check authentication
8. UI works at 375px mobile width
9. No console.log/warn/error in production code (dev only)
10. Conventional Commits format on all commit messages

## Data-Testid Convention
Every interactive element that E2E tests target MUST have a `data-testid` attribute.
Format: `<context>-<element>[-<index>]`
Examples: `todo-input`, `todo-checkbox-0`, `login-button`, `sidebar-skill-todos`
