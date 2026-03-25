/**
 * Unit tests for todo-at-home domains API routes.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock Prisma ────────────────────────────────────────────────────
const mockPrisma = {
  todoDomain: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  todoContext: {
    create: vi.fn(),
  },
  $transaction: vi.fn(),
};
vi.stubGlobal('prisma', mockPrisma);

const mockRequireUserId = vi.fn();
vi.stubGlobal('requireUserId', (...args: unknown[]) => mockRequireUserId(...args));

vi.stubGlobal('defineEventHandler', (fn: (...args: unknown[]) => unknown) => fn);
vi.stubGlobal('createError', (opts: { statusCode: number; message: string; data?: unknown }) => {
  const err = new Error(opts.message) as Error & { statusCode: number; data?: unknown };
  err.statusCode = opts.statusCode;
  err.data = opts.data;
  return err;
});
vi.stubGlobal('readBody', (event: { _body?: unknown }) => Promise.resolve(event._body));
vi.stubGlobal(
  'getRouterParam',
  (event: { context?: { params?: Record<string, string> } }, key: string) =>
    event.context?.params?.[key],
);
vi.stubGlobal('setResponseStatus', vi.fn());

const TEST_USER_ID = 'user-123';
const TEST_DOMAIN = {
  id: 'domain-1',
  name: 'Maison',
  icon: '🏠',
  description: null,
  sortOrder: 0,
  createdAt: new Date('2026-01-01'),
  _count: { contexts: 1 },
};

describe('GET /api/skills/todo-at-home/domains', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireUserId.mockResolvedValue(TEST_USER_ID);
  });

  it('returns domains for authenticated user', async () => {
    mockPrisma.todoDomain.findMany.mockResolvedValue([TEST_DOMAIN]);

    const handler = (await import('~/server/api/skills/todo-at-home/domains/index.get')).default;
    const result = await handler({} as never);

    expect(result).toEqual({ data: [TEST_DOMAIN] });
  });
});

describe('POST /api/skills/todo-at-home/domains', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireUserId.mockResolvedValue(TEST_USER_ID);
  });

  it('creates domain with Global context via transaction', async () => {
    mockPrisma.$transaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      const tx = {
        todoDomain: {
          create: vi.fn().mockResolvedValue({ id: 'domain-new' }),
          findUniqueOrThrow: vi.fn().mockResolvedValue(TEST_DOMAIN),
        },
        todoContext: {
          create: vi.fn().mockResolvedValue({}),
        },
      };
      return fn(tx);
    });

    const handler = (await import('~/server/api/skills/todo-at-home/domains/index.post')).default;
    const result = await handler({ _body: { name: 'Maison', icon: '🏠' } } as never);

    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ data: TEST_DOMAIN });
  });

  it('rejects empty name', async () => {
    const handler = (await import('~/server/api/skills/todo-at-home/domains/index.post')).default;
    await expect(handler({ _body: { name: '' } } as never)).rejects.toMatchObject({ statusCode: 400 });
  });
});

describe('DELETE /api/skills/todo-at-home/domains/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireUserId.mockResolvedValue(TEST_USER_ID);
  });

  it('deletes an owned domain', async () => {
    mockPrisma.todoDomain.findUnique.mockResolvedValue({ ...TEST_DOMAIN, userId: TEST_USER_ID });
    mockPrisma.todoDomain.delete.mockResolvedValue({});

    const handler = (await import('~/server/api/skills/todo-at-home/domains/[id].delete')).default;
    const result = await handler({ context: { params: { id: TEST_DOMAIN.id } } } as never);

    expect(result).toEqual({ data: { id: TEST_DOMAIN.id } });
  });

  it('returns 404 for another users domain', async () => {
    mockPrisma.todoDomain.findUnique.mockResolvedValue({ ...TEST_DOMAIN, userId: 'other' });

    const handler = (await import('~/server/api/skills/todo-at-home/domains/[id].delete')).default;
    await expect(
      handler({ context: { params: { id: TEST_DOMAIN.id } } } as never),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});
