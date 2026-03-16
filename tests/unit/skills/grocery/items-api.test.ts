/**
 * Unit tests for grocery items API routes.
 * Uses 'node' environment (matched by *-api.test.ts glob in vitest.config.ts).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mock Prisma ───────────────────────────────────────────────────
const mockPrisma = {
  groceryItem: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
  },
  groceryProduct: {
    upsert: vi.fn(),
  },
  groceryCategory: {
    findUnique: vi.fn(),
  },
  $transaction: vi.fn(),
}

vi.mock('~/server/utils/prisma', () => ({ prisma: mockPrisma }))

// ─── Mock Auth ─────────────────────────────────────────────────────
const mockRequireUserId = vi.fn()
vi.mock('~/server/utils/auth', () => ({
  requireUserId: (...args: unknown[]) => mockRequireUserId(...args),
}))

// ─── Mock Nitro globals ────────────────────────────────────────────
// defineEventHandler just returns the function it receives
vi.stubGlobal('defineEventHandler', (fn: Function) => fn)
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

// ─── Constants ─────────────────────────────────────────────────────
const TEST_USER_ID = 'user-123'
const TEST_ITEM = {
  id: 'item-1',
  name: 'Lait',
  quantity: 2,
  unit: 'L',
  categoryId: null,
  category: null,
  checked: false,
  checkedAt: null,
  sortOrder: 0,
  createdAt: new Date('2026-01-01'),
}

describe('GET /api/skills/grocery/items', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireUserId.mockResolvedValue(TEST_USER_ID)
  })

  it('returns items for authenticated user', async () => {
    mockPrisma.groceryItem.findMany.mockResolvedValue([TEST_ITEM])

    const handler = (await import('~/server/api/skills/grocery/items/index.get')).default
    const result = await handler({} as never)

    expect(mockRequireUserId).toHaveBeenCalled()
    expect(mockPrisma.groceryItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: TEST_USER_ID },
      }),
    )
    expect(result).toEqual({ data: [TEST_ITEM] })
  })
})

describe('POST /api/skills/grocery/items', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireUserId.mockResolvedValue(TEST_USER_ID)
  })

  it('creates item and upserts product catalog entry', async () => {
    const createdItem = { ...TEST_ITEM, id: 'item-new' }
    mockPrisma.$transaction.mockResolvedValue([createdItem, {}])

    const handler = (await import('~/server/api/skills/grocery/items/index.post')).default
    const result = await handler({
      _body: { name: 'Lait', quantity: 2, unit: 'L' },
    } as never)

    // $transaction receives an array of PrismaPromises (lazy evaluators),
    // which are undefined because create/upsert mocks return undefined by default.
    // We verify the transaction was called and the result is correctly destructured.
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1)
    expect(result).toEqual({ data: createdItem })
  })

  it('validates category ownership when categoryId is provided', async () => {
    mockPrisma.groceryCategory.findUnique.mockResolvedValue({
      id: 'cat-1',
      userId: 'other-user',
    })

    const handler = (await import('~/server/api/skills/grocery/items/index.post')).default

    await expect(
      handler({
        _body: { name: 'Lait', categoryId: 'cat-1' },
      } as never),
    ).rejects.toMatchObject({ statusCode: 400 })
  })

  it('rejects invalid input (empty name)', async () => {
    const handler = (await import('~/server/api/skills/grocery/items/index.post')).default

    await expect(
      handler({ _body: { name: '' } } as never),
    ).rejects.toMatchObject({ statusCode: 400 })
  })
})

describe('PATCH /api/skills/grocery/items/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireUserId.mockResolvedValue(TEST_USER_ID)
  })

  it('returns 404 when item does not exist', async () => {
    mockPrisma.groceryItem.findUnique.mockResolvedValue(null)

    const handler = (await import('~/server/api/skills/grocery/items/[id].patch')).default

    await expect(
      handler({
        context: { params: { id: 'nonexistent' } },
        _body: { checked: true },
      } as never),
    ).rejects.toMatchObject({ statusCode: 404 })
  })

  it('returns 404 when item belongs to another user', async () => {
    mockPrisma.groceryItem.findUnique.mockResolvedValue({
      ...TEST_ITEM,
      userId: 'other-user',
    })

    const handler = (await import('~/server/api/skills/grocery/items/[id].patch')).default

    await expect(
      handler({
        context: { params: { id: TEST_ITEM.id } },
        _body: { checked: true },
      } as never),
    ).rejects.toMatchObject({ statusCode: 404 })
  })

  it('sets checkedAt when checking an item', async () => {
    mockPrisma.groceryItem.findUnique.mockResolvedValue({
      ...TEST_ITEM,
      userId: TEST_USER_ID,
      checked: false,
    })
    mockPrisma.groceryItem.update.mockResolvedValue({
      ...TEST_ITEM,
      checked: true,
      checkedAt: new Date(),
    })

    const handler = (await import('~/server/api/skills/grocery/items/[id].patch')).default
    await handler({
      context: { params: { id: TEST_ITEM.id } },
      _body: { checked: true },
    } as never)

    expect(mockPrisma.groceryItem.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          checked: true,
          checkedAt: expect.any(Date),
        }),
      }),
    )
  })

  it('clears checkedAt when unchecking an item', async () => {
    mockPrisma.groceryItem.findUnique.mockResolvedValue({
      ...TEST_ITEM,
      userId: TEST_USER_ID,
      checked: true,
      checkedAt: new Date(),
    })
    mockPrisma.groceryItem.update.mockResolvedValue({
      ...TEST_ITEM,
      checked: false,
      checkedAt: null,
    })

    const handler = (await import('~/server/api/skills/grocery/items/[id].patch')).default
    await handler({
      context: { params: { id: TEST_ITEM.id } },
      _body: { checked: false },
    } as never)

    expect(mockPrisma.groceryItem.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          checked: false,
          checkedAt: null,
        }),
      }),
    )
  })
})

describe('DELETE /api/skills/grocery/items/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireUserId.mockResolvedValue(TEST_USER_ID)
  })

  it('deletes an owned item', async () => {
    mockPrisma.groceryItem.findUnique.mockResolvedValue({
      ...TEST_ITEM,
      userId: TEST_USER_ID,
    })
    mockPrisma.groceryItem.delete.mockResolvedValue({})

    const handler = (await import('~/server/api/skills/grocery/items/[id].delete')).default
    const result = await handler({
      context: { params: { id: TEST_ITEM.id } },
    } as never)

    expect(result).toEqual({ data: { id: TEST_ITEM.id } })
  })
})

describe('DELETE /api/skills/grocery/items/checked', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireUserId.mockResolvedValue(TEST_USER_ID)
  })

  it('deletes all checked items for the user', async () => {
    mockPrisma.groceryItem.deleteMany.mockResolvedValue({ count: 3 })

    const handler = (await import('~/server/api/skills/grocery/items/checked.delete')).default
    const result = await handler({} as never)

    expect(mockPrisma.groceryItem.deleteMany).toHaveBeenCalledWith({
      where: { userId: TEST_USER_ID, checked: true },
    })
    expect(result).toEqual({ data: { deletedCount: 3 } })
  })
})
