/**
 * Unit tests for todo-at-home contexts API routes.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock Prisma ────────────────────────────────────────────────────
const mockPrisma = {
  todoContext: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  todoDomain: {
    findUnique: vi.fn(),
  },
  todoTask: {
    updateMany: vi.fn(),
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
vi.stubGlobal('getQuery', (event: { _query?: unknown }) => event._query ?? {});
vi.stubGlobal(
  'getRouterParam',
  (event: { context?: { params?: Record<string, string> } }, key: string) =>
    event.context?.params?.[key],
);
vi.stubGlobal('setResponseStatus', vi.fn());

const TEST_USER_ID = 'user-123';
const TEST_CONTEXT = {
  id: 'ctx-1',
  domainId: 'domain-1',
  name: 'Cuisine',
  icon: '🍳',
  color: '#F59E0B',
  imageUrl: null,
  sortOrder: 0,
  isGlobal: false,
  createdAt: new Date('2026-01-01'),
  _count: { tasks: 3 },
};

describe('GET /api/skills/todo-at-home/contexts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireUserId.mockResolvedValue(TEST_USER_ID);
  });

  it('returns contexts for authenticated user', async () => {
    mockPrisma.todoContext.findMany.mockResolvedValue([TEST_CONTEXT]);

    const handler = (await import('~/server/api/skills/todo-at-home/contexts/index.get')).default;
    const result = await handler({ _query: {} } as never);

    expect(result).toEqual({ data: [TEST_CONTEXT] });
  });

  it('filters by domainId', async () => {
    mockPrisma.todoContext.findMany.mockResolvedValue([TEST_CONTEXT]);

    const handler = (await import('~/server/api/skills/todo-at-home/contexts/index.get')).default;
    await handler({ _query: { domainId: 'domain-1' } } as never);

    expect(mockPrisma.todoContext.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: TEST_USER_ID, domainId: 'domain-1' },
      }),
    );
  });
});

describe('POST /api/skills/todo-at-home/contexts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireUserId.mockResolvedValue(TEST_USER_ID);
  });

  it('creates a context after verifying domain ownership', async () => {
    mockPrisma.todoDomain.findUnique.mockResolvedValue({ id: 'domain-1', userId: TEST_USER_ID });
    mockPrisma.todoContext.create.mockResolvedValue(TEST_CONTEXT);

    const handler = (await import('~/server/api/skills/todo-at-home/contexts/index.post')).default;
    const result = await handler({
      _body: { domainId: 'domain-1', name: 'Cuisine', color: '#F59E0B' },
    } as never);

    expect(result).toEqual({ data: TEST_CONTEXT });
  });

  it('rejects invalid domain', async () => {
    mockPrisma.todoDomain.findUnique.mockResolvedValue({ id: 'domain-1', userId: 'other' });

    const handler = (await import('~/server/api/skills/todo-at-home/contexts/index.post')).default;
    await expect(
      handler({ _body: { domainId: 'domain-1', name: 'Test' } } as never),
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});

describe('DELETE /api/skills/todo-at-home/contexts/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireUserId.mockResolvedValue(TEST_USER_ID);
  });

  it('prevents deleting Global context', async () => {
    mockPrisma.todoContext.findUnique.mockResolvedValue({
      ...TEST_CONTEXT,
      userId: TEST_USER_ID,
      isGlobal: true,
    });

    const handler = (await import('~/server/api/skills/todo-at-home/contexts/[id].delete')).default;
    await expect(
      handler({ context: { params: { id: TEST_CONTEXT.id } } } as never),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('migrates tasks to Global context before deleting', async () => {
    mockPrisma.todoContext.findUnique.mockResolvedValue({
      ...TEST_CONTEXT,
      userId: TEST_USER_ID,
      isGlobal: false,
      domainId: 'domain-1',
    });
    mockPrisma.todoContext.findFirst.mockResolvedValue({ id: 'global-ctx', isGlobal: true });
    mockPrisma.$transaction.mockResolvedValue([{}, {}]);

    const handler = (await import('~/server/api/skills/todo-at-home/contexts/[id].delete')).default;
    const result = await handler({ context: { params: { id: TEST_CONTEXT.id } } } as never);

    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ data: { id: TEST_CONTEXT.id } });
  });
});
