/**
 * Unit tests for todo-at-home tasks API routes.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock Prisma ────────────────────────────────────────────────────
const mockPrisma = {
  todoTask: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  todoContext: {
    findUnique: vi.fn(),
  },
  householdMember: {
    findUnique: vi.fn(),
  },
  todoSubtask: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
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
const TEST_TASK = {
  id: 'task-1',
  contextId: 'ctx-1',
  context: { id: 'ctx-1', name: 'Cuisine', color: '#F59E0B', icon: '🍳', domainId: 'domain-1' },
  title: 'Nettoyer',
  description: null,
  status: 'todo',
  priority: 'normal',
  color: null,
  dueDate: null,
  assigneeId: null,
  assignee: null,
  sortOrder: 0,
  completedAt: null,
  createdAt: new Date('2026-01-01'),
  subtasks: [],
};

describe('GET /api/skills/todo-at-home/tasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireUserId.mockResolvedValue(TEST_USER_ID);
  });

  it('returns tasks for authenticated user', async () => {
    mockPrisma.todoTask.findMany.mockResolvedValue([TEST_TASK]);

    const handler = (await import('~/server/api/skills/todo-at-home/tasks/index.get')).default;
    const result = await handler({ _query: {} } as never);

    expect(result).toEqual({ data: [TEST_TASK] });
  });

  it('applies status filter', async () => {
    mockPrisma.todoTask.findMany.mockResolvedValue([]);

    const handler = (await import('~/server/api/skills/todo-at-home/tasks/index.get')).default;
    await handler({ _query: { status: 'todo,in_progress' } } as never);

    expect(mockPrisma.todoTask.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: TEST_USER_ID,
          status: { in: ['todo', 'in_progress'] },
        }),
      }),
    );
  });

  it('applies search filter (case insensitive)', async () => {
    mockPrisma.todoTask.findMany.mockResolvedValue([]);

    const handler = (await import('~/server/api/skills/todo-at-home/tasks/index.get')).default;
    await handler({ _query: { search: 'aspirateur' } } as never);

    expect(mockPrisma.todoTask.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          title: { contains: 'aspirateur', mode: 'insensitive' },
        }),
      }),
    );
  });

  it('applies withDueDate filter', async () => {
    mockPrisma.todoTask.findMany.mockResolvedValue([]);

    const handler = (await import('~/server/api/skills/todo-at-home/tasks/index.get')).default;
    await handler({ _query: { withDueDate: 'true' } } as never);

    expect(mockPrisma.todoTask.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          dueDate: { not: null },
        }),
      }),
    );
  });
});

describe('POST /api/skills/todo-at-home/tasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireUserId.mockResolvedValue(TEST_USER_ID);
  });

  it('creates a task after verifying context ownership', async () => {
    mockPrisma.todoContext.findUnique.mockResolvedValue({ id: 'ctx-1', userId: TEST_USER_ID });
    mockPrisma.todoTask.create.mockResolvedValue(TEST_TASK);

    const handler = (await import('~/server/api/skills/todo-at-home/tasks/index.post')).default;
    const result = await handler({
      _body: { contextId: 'ctx-1', title: 'Nettoyer' },
    } as never);

    expect(result).toEqual({ data: TEST_TASK });
  });

  it('rejects invalid context', async () => {
    mockPrisma.todoContext.findUnique.mockResolvedValue({ id: 'ctx-1', userId: 'other' });

    const handler = (await import('~/server/api/skills/todo-at-home/tasks/index.post')).default;
    await expect(
      handler({ _body: { contextId: 'ctx-1', title: 'Test' } } as never),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('rejects invalid assignee', async () => {
    mockPrisma.todoContext.findUnique.mockResolvedValue({ id: 'ctx-1', userId: TEST_USER_ID });
    mockPrisma.householdMember.findUnique.mockResolvedValue({ id: 'member-1', userId: 'other' });

    const handler = (await import('~/server/api/skills/todo-at-home/tasks/index.post')).default;
    await expect(
      handler({ _body: { contextId: 'ctx-1', title: 'Test', assigneeId: 'member-1' } } as never),
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});

describe('PATCH /api/skills/todo-at-home/tasks/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireUserId.mockResolvedValue(TEST_USER_ID);
  });

  it('sets completedAt when status changes to done', async () => {
    mockPrisma.todoTask.findUnique.mockResolvedValue({ ...TEST_TASK, userId: TEST_USER_ID, status: 'todo' });
    mockPrisma.todoTask.update.mockResolvedValue({ ...TEST_TASK, status: 'done' });

    const handler = (await import('~/server/api/skills/todo-at-home/tasks/[id].patch')).default;
    await handler({
      context: { params: { id: TEST_TASK.id } },
      _body: { status: 'done' },
    } as never);

    expect(mockPrisma.todoTask.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'done',
          completedAt: expect.any(Date),
        }),
      }),
    );
  });

  it('clears completedAt when status changes from done', async () => {
    mockPrisma.todoTask.findUnique.mockResolvedValue({ ...TEST_TASK, userId: TEST_USER_ID, status: 'done' });
    mockPrisma.todoTask.update.mockResolvedValue({ ...TEST_TASK, status: 'todo' });

    const handler = (await import('~/server/api/skills/todo-at-home/tasks/[id].patch')).default;
    await handler({
      context: { params: { id: TEST_TASK.id } },
      _body: { status: 'todo' },
    } as never);

    expect(mockPrisma.todoTask.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'todo',
          completedAt: null,
        }),
      }),
    );
  });

  it('returns 404 for another users task', async () => {
    mockPrisma.todoTask.findUnique.mockResolvedValue({ ...TEST_TASK, userId: 'other' });

    const handler = (await import('~/server/api/skills/todo-at-home/tasks/[id].patch')).default;
    await expect(
      handler({ context: { params: { id: TEST_TASK.id } }, _body: { title: 'X' } } as never),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('DELETE /api/skills/todo-at-home/tasks/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireUserId.mockResolvedValue(TEST_USER_ID);
  });

  it('deletes an owned task', async () => {
    mockPrisma.todoTask.findUnique.mockResolvedValue({ ...TEST_TASK, userId: TEST_USER_ID });
    mockPrisma.todoTask.delete.mockResolvedValue({});

    const handler = (await import('~/server/api/skills/todo-at-home/tasks/[id].delete')).default;
    const result = await handler({ context: { params: { id: TEST_TASK.id } } } as never);

    expect(result).toEqual({ data: { id: TEST_TASK.id } });
  });
});

describe('POST /api/skills/todo-at-home/tasks/:taskId/subtasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireUserId.mockResolvedValue(TEST_USER_ID);
  });

  it('creates a subtask after verifying task ownership', async () => {
    mockPrisma.todoTask.findUnique.mockResolvedValue({ ...TEST_TASK, userId: TEST_USER_ID });
    const subtask = { id: 'sub-1', title: 'Sous-tâche', completed: false, sortOrder: 0, createdAt: new Date() };
    mockPrisma.todoSubtask.create.mockResolvedValue(subtask);

    const handler = (await import('~/server/api/skills/todo-at-home/tasks/[taskId]/subtasks/index.post')).default;
    const result = await handler({
      context: { params: { taskId: TEST_TASK.id } },
      _body: { title: 'Sous-tâche' },
    } as never);

    expect(result).toEqual({ data: subtask });
  });

  it('returns 404 for task owned by another user', async () => {
    mockPrisma.todoTask.findUnique.mockResolvedValue({ ...TEST_TASK, userId: 'other' });

    const handler = (await import('~/server/api/skills/todo-at-home/tasks/[taskId]/subtasks/index.post')).default;
    await expect(
      handler({
        context: { params: { taskId: TEST_TASK.id } },
        _body: { title: 'Test' },
      } as never),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('PATCH /api/skills/todo-at-home/tasks/:taskId/subtasks/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireUserId.mockResolvedValue(TEST_USER_ID);
  });

  it('updates a subtask', async () => {
    mockPrisma.todoTask.findUnique.mockResolvedValue({ ...TEST_TASK, userId: TEST_USER_ID });
    mockPrisma.todoSubtask.findUnique.mockResolvedValue({ id: 'sub-1', taskId: TEST_TASK.id });
    const updated = { id: 'sub-1', title: 'Done', completed: true, sortOrder: 0, createdAt: new Date() };
    mockPrisma.todoSubtask.update.mockResolvedValue(updated);

    const handler = (await import('~/server/api/skills/todo-at-home/tasks/[taskId]/subtasks/[id].patch')).default;
    const result = await handler({
      context: { params: { taskId: TEST_TASK.id, id: 'sub-1' } },
      _body: { completed: true },
    } as never);

    expect(result).toEqual({ data: updated });
  });

  it('returns 404 if subtask belongs to different task', async () => {
    mockPrisma.todoTask.findUnique.mockResolvedValue({ ...TEST_TASK, userId: TEST_USER_ID });
    mockPrisma.todoSubtask.findUnique.mockResolvedValue({ id: 'sub-1', taskId: 'other-task' });

    const handler = (await import('~/server/api/skills/todo-at-home/tasks/[taskId]/subtasks/[id].patch')).default;
    await expect(
      handler({
        context: { params: { taskId: TEST_TASK.id, id: 'sub-1' } },
        _body: { completed: true },
      } as never),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('DELETE /api/skills/todo-at-home/tasks/:taskId/subtasks/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireUserId.mockResolvedValue(TEST_USER_ID);
  });

  it('deletes a subtask', async () => {
    mockPrisma.todoTask.findUnique.mockResolvedValue({ ...TEST_TASK, userId: TEST_USER_ID });
    mockPrisma.todoSubtask.findUnique.mockResolvedValue({ id: 'sub-1', taskId: TEST_TASK.id });
    mockPrisma.todoSubtask.delete.mockResolvedValue({});

    const handler = (await import('~/server/api/skills/todo-at-home/tasks/[taskId]/subtasks/[id].delete')).default;
    const result = await handler({
      context: { params: { taskId: TEST_TASK.id, id: 'sub-1' } },
    } as never);

    expect(result).toEqual({ data: { id: 'sub-1' } });
  });
});
