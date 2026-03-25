/**
 * Unit tests for household members API routes.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock Prisma ────────────────────────────────────────────────────
const mockPrisma = {
  householdMember: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
};
vi.stubGlobal('prisma', mockPrisma);

// ─── Mock Auth ──────────────────────────────────────────────────────
const mockRequireUserId = vi.fn();
vi.stubGlobal('requireUserId', (...args: unknown[]) => mockRequireUserId(...args));

// ─── Mock Nitro globals ─────────────────────────────────────────────
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
const TEST_MEMBER = {
  id: 'member-1',
  name: 'Moi',
  avatar: '👤',
  role: 'parent',
  sortOrder: 0,
  createdAt: new Date('2026-01-01'),
};

describe('GET /api/household/members', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireUserId.mockResolvedValue(TEST_USER_ID);
  });

  it('returns members for authenticated user', async () => {
    mockPrisma.householdMember.findMany.mockResolvedValue([TEST_MEMBER]);

    const handler = (await import('~/server/api/household/members/index.get')).default;
    const result = await handler({} as never);

    expect(mockPrisma.householdMember.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: TEST_USER_ID } }),
    );
    expect(result).toEqual({ data: [TEST_MEMBER] });
  });
});

describe('POST /api/household/members', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireUserId.mockResolvedValue(TEST_USER_ID);
  });

  it('creates a member', async () => {
    mockPrisma.householdMember.create.mockResolvedValue(TEST_MEMBER);

    const handler = (await import('~/server/api/household/members/index.post')).default;
    const result = await handler({ _body: { name: 'Moi', avatar: '👤', role: 'parent' } } as never);

    expect(mockPrisma.householdMember.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: TEST_USER_ID, name: 'Moi' }),
      }),
    );
    expect(result).toEqual({ data: TEST_MEMBER });
  });

  it('rejects empty name', async () => {
    const handler = (await import('~/server/api/household/members/index.post')).default;
    await expect(handler({ _body: { name: '' } } as never)).rejects.toMatchObject({ statusCode: 400 });
  });
});

describe('PATCH /api/household/members/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireUserId.mockResolvedValue(TEST_USER_ID);
  });

  it('returns 404 for non-existent member', async () => {
    mockPrisma.householdMember.findUnique.mockResolvedValue(null);

    const handler = (await import('~/server/api/household/members/[id].patch')).default;
    await expect(
      handler({ context: { params: { id: 'nope' } }, _body: { name: 'Test' } } as never),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('returns 404 for member owned by another user', async () => {
    mockPrisma.householdMember.findUnique.mockResolvedValue({ ...TEST_MEMBER, userId: 'other' });

    const handler = (await import('~/server/api/household/members/[id].patch')).default;
    await expect(
      handler({ context: { params: { id: TEST_MEMBER.id } }, _body: { name: 'Test' } } as never),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('updates an owned member', async () => {
    mockPrisma.householdMember.findUnique.mockResolvedValue({ ...TEST_MEMBER, userId: TEST_USER_ID });
    const updated = { ...TEST_MEMBER, name: 'Papa' };
    mockPrisma.householdMember.update.mockResolvedValue(updated);

    const handler = (await import('~/server/api/household/members/[id].patch')).default;
    const result = await handler({
      context: { params: { id: TEST_MEMBER.id } },
      _body: { name: 'Papa' },
    } as never);

    expect(result).toEqual({ data: updated });
  });
});

describe('DELETE /api/household/members/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireUserId.mockResolvedValue(TEST_USER_ID);
  });

  it('deletes an owned member', async () => {
    mockPrisma.householdMember.findUnique.mockResolvedValue({ ...TEST_MEMBER, userId: TEST_USER_ID });
    mockPrisma.householdMember.delete.mockResolvedValue({});

    const handler = (await import('~/server/api/household/members/[id].delete')).default;
    const result = await handler({ context: { params: { id: TEST_MEMBER.id } } } as never);

    expect(result).toEqual({ data: { id: TEST_MEMBER.id } });
  });
});
