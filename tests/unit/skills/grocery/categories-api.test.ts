/**
 * Unit tests for grocery categories API routes.
 * Uses 'node' environment (matched by *-api.test.ts glob in vitest.config.ts).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mock Prisma ───────────────────────────────────────────────────
const mockPrisma = {
  groceryCategory: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}

vi.mock('~/server/utils/prisma', () => ({ prisma: mockPrisma }))

// ─── Mock Auth ─────────────────────────────────────────────────────
const mockRequireUserId = vi.fn()
vi.mock('~/server/utils/auth', () => ({
  requireUserId: (...args: unknown[]) => mockRequireUserId(...args),
}))

// ─── Mock Nitro globals ────────────────────────────────────────────
vi.stubGlobal('defineEventHandler', (fn: (...args: unknown[]) => unknown) => fn)
vi.stubGlobal('createError', (opts: { statusCode: number; message: string; data?: unknown }) => {
  const err = new Error(opts.message) as Error & { statusCode: number; data?: unknown }
  err.statusCode = opts.statusCode
  err.data = opts.data
  return err
})
vi.stubGlobal('readBody', (event: { _body?: unknown }) => Promise.resolve(event._body))
vi.stubGlobal('getRouterParam', (event: { context?: { params?: Record<string, string> } }, key: string) =>
  event.context?.params?.[key],
)
vi.stubGlobal('setResponseStatus', vi.fn())

const TEST_USER_ID = 'user-123'

describe('GET /api/skills/grocery/categories', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireUserId.mockResolvedValue(TEST_USER_ID)
  })

  it('returns categories sorted by sortOrder', async () => {
    const categories = [
      { id: 'cat-1', name: 'Fruits', sortOrder: 0, _count: { items: 3 } },
      { id: 'cat-2', name: 'Laitier', sortOrder: 1, _count: { items: 1 } },
    ]
    mockPrisma.groceryCategory.findMany.mockResolvedValue(categories)

    const handler = (await import('~/server/api/skills/grocery/categories/index.get')).default
    const result = await handler({} as never)

    expect(mockPrisma.groceryCategory.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: TEST_USER_ID },
        orderBy: { sortOrder: 'asc' },
      }),
    )
    expect(result).toEqual({ data: categories })
  })
})

describe('POST /api/skills/grocery/categories', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireUserId.mockResolvedValue(TEST_USER_ID)
  })

  it('creates a new category', async () => {
    mockPrisma.groceryCategory.findUnique.mockResolvedValue(null)
    const created = { id: 'cat-new', name: 'Boulangerie', sortOrder: 0 }
    mockPrisma.groceryCategory.create.mockResolvedValue(created)

    const handler = (await import('~/server/api/skills/grocery/categories/index.post')).default
    const result = await handler({
      _body: { name: 'Boulangerie' },
    } as never)

    expect(result).toEqual({ data: created })
  })

  it('rejects duplicate category name', async () => {
    mockPrisma.groceryCategory.findUnique.mockResolvedValue({
      id: 'cat-1',
      name: 'Fruits',
      userId: TEST_USER_ID,
    })

    const handler = (await import('~/server/api/skills/grocery/categories/index.post')).default

    await expect(
      handler({ _body: { name: 'Fruits' } } as never),
    ).rejects.toMatchObject({ statusCode: 400, message: 'Cette catégorie existe déjà' })
  })

  it('rejects empty name', async () => {
    const handler = (await import('~/server/api/skills/grocery/categories/index.post')).default

    await expect(
      handler({ _body: { name: '' } } as never),
    ).rejects.toMatchObject({ statusCode: 400 })
  })
})

describe('PATCH /api/skills/grocery/categories/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireUserId.mockResolvedValue(TEST_USER_ID)
  })

  it('updates an owned category', async () => {
    mockPrisma.groceryCategory.findUnique
      .mockResolvedValueOnce({ id: 'cat-1', userId: TEST_USER_ID, name: 'Fruits' })
      .mockResolvedValueOnce(null) // no duplicate
    mockPrisma.groceryCategory.update.mockResolvedValue({ id: 'cat-1', name: 'Légumes', sortOrder: 0 })

    const handler = (await import('~/server/api/skills/grocery/categories/[id].patch')).default
    const result = await handler({
      context: { params: { id: 'cat-1' } },
      _body: { name: 'Légumes' },
    } as never)

    expect(result).toEqual({ data: { id: 'cat-1', name: 'Légumes', sortOrder: 0 } })
  })

  it('rejects renaming to an existing name', async () => {
    mockPrisma.groceryCategory.findUnique
      .mockResolvedValueOnce({ id: 'cat-1', userId: TEST_USER_ID, name: 'Fruits' })
      .mockResolvedValueOnce({ id: 'cat-2', userId: TEST_USER_ID, name: 'Légumes' })

    const handler = (await import('~/server/api/skills/grocery/categories/[id].patch')).default

    await expect(
      handler({
        context: { params: { id: 'cat-1' } },
        _body: { name: 'Légumes' },
      } as never),
    ).rejects.toMatchObject({ statusCode: 400, message: 'Cette catégorie existe déjà' })
  })
})

describe('DELETE /api/skills/grocery/categories/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireUserId.mockResolvedValue(TEST_USER_ID)
  })

  it('deletes an owned category', async () => {
    mockPrisma.groceryCategory.findUnique.mockResolvedValue({
      id: 'cat-1',
      userId: TEST_USER_ID,
    })
    mockPrisma.groceryCategory.delete.mockResolvedValue({})

    const handler = (await import('~/server/api/skills/grocery/categories/[id].delete')).default
    const result = await handler({
      context: { params: { id: 'cat-1' } },
    } as never)

    expect(result).toEqual({ data: { id: 'cat-1' } })
  })

  it('returns 404 for non-owned category', async () => {
    mockPrisma.groceryCategory.findUnique.mockResolvedValue({
      id: 'cat-1',
      userId: 'other-user',
    })

    const handler = (await import('~/server/api/skills/grocery/categories/[id].delete')).default

    await expect(
      handler({
        context: { params: { id: 'cat-1' } },
      } as never),
    ).rejects.toMatchObject({ statusCode: 404 })
  })
})
