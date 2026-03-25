/**
 * GET /api/skills/todo-at-home/tasks — List tasks with full filtering support.
 * Filters: contextId, domainId, status, priority, assigneeId, search, sort, order, withDueDate.
 */
import { z } from 'zod';
import type { Prisma } from '@prisma/client';

const querySchema = z.object({
  contextId: z.string().optional(),
  domainId: z.string().optional(),
  status: z.string().optional(), // comma-separated: "todo,in_progress"
  priority: z.string().optional(), // comma-separated: "high,normal"
  assigneeId: z.string().optional(),
  search: z.string().optional(),
  sort: z.enum(['createdAt', 'dueDate', 'priority', 'sortOrder']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
  withDueDate: z.enum(['true', 'false']).optional(),
});

const PRIORITY_ORDER: Record<string, number> = { high: 0, normal: 1, low: 2 };

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event);

  const query = getQuery(event);
  const parsed = querySchema.safeParse(query);
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: 'Paramètres invalides',
      data: parsed.error.issues,
    });
  }

  const { contextId, domainId, status, priority, assigneeId, search, sort, order, withDueDate } = parsed.data;

  // Build where clause
  const where: Prisma.TodoTaskWhereInput = { userId };

  if (contextId) {
    where.contextId = contextId;
  }
  if (domainId) {
    where.context = { domainId };
  }
  if (status) {
    const statuses = status.split(',');
    where.status = { in: statuses };
  }
  if (priority) {
    const priorities = priority.split(',');
    where.priority = { in: priorities };
  }
  if (assigneeId) {
    where.assigneeId = assigneeId;
  }
  if (search) {
    where.title = { contains: search, mode: 'insensitive' };
  }
  if (withDueDate === 'true') {
    where.dueDate = { not: null };
  }

  // Build orderBy
  const sortField = sort ?? 'createdAt';
  const sortOrder = order ?? 'desc';
  let orderBy: Prisma.TodoTaskOrderByWithRelationInput[];

  if (sortField === 'priority') {
    // Priority sorting is handled in-memory since it's an enum-like string
    orderBy = [{ createdAt: sortOrder }];
  } else {
    orderBy = [{ [sortField]: sortOrder }];
  }

  const tasks = await prisma.todoTask.findMany({
    where,
    select: {
      id: true,
      contextId: true,
      context: { select: { id: true, name: true, color: true, icon: true, domainId: true } },
      title: true,
      description: true,
      status: true,
      priority: true,
      color: true,
      dueDate: true,
      assigneeId: true,
      assignee: { select: { id: true, name: true, avatar: true } },
      sortOrder: true,
      completedAt: true,
      createdAt: true,
      subtasks: {
        select: { id: true, title: true, completed: true, sortOrder: true },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      },
    },
    orderBy,
  });

  // Sort by priority in-memory if requested
  if (sortField === 'priority') {
    tasks.sort((a, b) => {
      const diff = (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1);
      return sortOrder === 'asc' ? diff : -diff;
    });
  }

  return { data: tasks };
});
