/**
 * Unit tests for grocery products API routes.
 * Uses 'node' environment (matched by *-api.test.ts glob in vitest.config.ts).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mock Prisma ───────────────────────────────────────────────────
const mockPrisma = {
  groceryProduct: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
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
vi.stubGlobal('getQuery', (event: { _query?: Record<string, unknown> }) => event._query ?? {})
vi.stubGlobal('getRouterParam', (event: { context?: { params?: Record<string, string> } }, key: string) =>
  event.context?.params?.[key],
)

const TEST_USER_ID = 'user-123'

describe('GET /api/skills/grocery/products', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireUserId.mockResolvedValue(TEST_USER_ID)
  })

  it('returns products sorted by usageCount descending', async () => {
    const products = [
      { id: 'p-1', name: 'Lait', categoryId: null, category: null, usageCount: 10 },
      { id: 'p-2', name: 'Pain', categoryId: null, category: null, usageCount: 5 },
    ]
    mockPrisma.groceryProduct.findMany.mockResolvedValue(products)

    const handler = (await import('~/server/api/skills/grocery/products/index.get')).default
    const result = await handler({} as never)

    expect(mockPrisma.groceryProduct.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { usageCount: 'desc' },
        take: 20,
      }),
    )
    expect(result).toEqual({ data: products })
  })

  it('filters by search query when provided', async () => {
    mockPrisma.groceryProduct.findMany.mockResolvedValue([])

    const handler = (await import('~/server/api/skills/grocery/products/index.get')).default
    await handler({ _query: { search: 'lai' } } as never)

    expect(mockPrisma.groceryProduct.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: TEST_USER_ID,
          name: { contains: 'lai', mode: 'insensitive' },
        }),
      }),
    )
  })
})

describe('DELETE /api/skills/grocery/products/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireUserId.mockResolvedValue(TEST_USER_ID)
  })

  it('deletes an owned product', async () => {
    mockPrisma.groceryProduct.findUnique.mockResolvedValue({
      id: 'p-1',
      userId: TEST_USER_ID,
    })
    mockPrisma.groceryProduct.delete.mockResolvedValue({})

    const handler = (await import('~/server/api/skills/grocery/products/[id].delete')).default
    const result = await handler({
      context: { params: { id: 'p-1' } },
    } as never)

    expect(result).toEqual({ data: { id: 'p-1' } })
  })

  it('returns 404 for non-owned product', async () => {
    mockPrisma.groceryProduct.findUnique.mockResolvedValue({
      id: 'p-1',
      userId: 'other-user',
    })

    const handler = (await import('~/server/api/skills/grocery/products/[id].delete')).default

    await expect(
      handler({
        context: { params: { id: 'p-1' } },
      } as never),
    ).rejects.toMatchObject({ statusCode: 404 })
  })
})
