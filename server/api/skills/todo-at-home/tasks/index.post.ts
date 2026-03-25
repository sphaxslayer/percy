/**
 * POST /api/skills/todo-at-home/tasks — Create a new task.
 */
import { z } from 'zod';

const createTaskSchema = z.object({
  contextId: z.string().min(1),
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  status: z.enum(['todo', 'in_progress', 'done']).optional(),
  priority: z.enum(['low', 'normal', 'high']).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
  dueDate: z.iso.datetime().nullable().optional(),
  assigneeId: z.string().nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
  subtasks: z.array(z.object({
    title: z.string().min(1).max(500),
  })).optional(),
});

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event);

  const body = await readBody(event);
  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: 'Données invalides',
      data: parsed.error.issues,
    });
  }

  // Verify context ownership
  const context = await prisma.todoContext.findUnique({
    where: { id: parsed.data.contextId },
  });
  if (!context || context.userId !== userId) {
    throw createError({ statusCode: 400, message: 'Contexte invalide' });
  }

  // Verify assignee ownership if provided
  if (parsed.data.assigneeId) {
    const assignee = await prisma.householdMember.findUnique({
      where: { id: parsed.data.assigneeId },
    });
    if (!assignee || assignee.userId !== userId) {
      throw createError({ statusCode: 400, message: 'Assigné invalide' });
    }
  }

  const task = await prisma.todoTask.create({
    data: {
      userId,
      contextId: parsed.data.contextId,
      title: parsed.data.title,
      description: parsed.data.description,
      status: parsed.data.status ?? 'todo',
      priority: parsed.data.priority ?? 'normal',
      color: parsed.data.color,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      assigneeId: parsed.data.assigneeId,
      sortOrder: parsed.data.sortOrder ?? 0,
      subtasks: parsed.data.subtasks
        ? { create: parsed.data.subtasks.map((s, i) => ({ title: s.title, sortOrder: i })) }
        : undefined,
    },
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
        orderBy: [{ sortOrder: 'asc' }],
      },
    },
  });

  setResponseStatus(event, 201);
  return { data: task };
});
