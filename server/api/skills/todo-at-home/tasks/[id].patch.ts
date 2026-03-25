/**
 * PATCH /api/skills/todo-at-home/tasks/:id — Update a task.
 * Sets completedAt when status changes to "done", clears it otherwise.
 */
import { z } from 'zod';

const updateTaskSchema = z.object({
  contextId: z.string().min(1).optional(),
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(2000).nullable().optional(),
  status: z.enum(['todo', 'in_progress', 'done']).optional(),
  priority: z.enum(['low', 'normal', 'high']).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
  dueDate: z.iso.datetime().nullable().optional(),
  assigneeId: z.string().nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event);
  const id = getRouterParam(event, 'id');

  const existing = await prisma.todoTask.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    throw createError({ statusCode: 404, message: 'Ressource non trouvée' });
  }

  const body = await readBody(event);
  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: 'Données invalides',
      data: parsed.error.issues,
    });
  }

  // Verify context ownership if changing context
  if (parsed.data.contextId) {
    const context = await prisma.todoContext.findUnique({
      where: { id: parsed.data.contextId },
    });
    if (!context || context.userId !== userId) {
      throw createError({ statusCode: 400, message: 'Contexte invalide' });
    }
  }

  // Verify assignee ownership if changing assignee
  if (parsed.data.assigneeId) {
    const assignee = await prisma.householdMember.findUnique({
      where: { id: parsed.data.assigneeId },
    });
    if (!assignee || assignee.userId !== userId) {
      throw createError({ statusCode: 400, message: 'Assigné invalide' });
    }
  }

  // Handle completedAt based on status change
  const data: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.dueDate !== undefined) {
    data.dueDate = parsed.data.dueDate ? new Date(parsed.data.dueDate) : null;
  }
  if (parsed.data.status === 'done' && existing.status !== 'done') {
    data.completedAt = new Date();
  } else if (parsed.data.status && parsed.data.status !== 'done' && existing.status === 'done') {
    data.completedAt = null;
  }

  const task = await prisma.todoTask.update({
    where: { id },
    data,
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

  return { data: task };
});
