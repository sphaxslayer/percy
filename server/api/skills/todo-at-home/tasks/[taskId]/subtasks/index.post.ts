/**
 * POST /api/skills/todo-at-home/tasks/:taskId/subtasks — Create a subtask.
 */
import { z } from 'zod';

const createSubtaskSchema = z.object({
  title: z.string().min(1).max(500),
  sortOrder: z.number().int().min(0).optional(),
});

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event);
  const taskId = getRouterParam(event, 'taskId');

  // Verify task ownership
  const task = await prisma.todoTask.findUnique({ where: { id: taskId } });
  if (!task || task.userId !== userId) {
    throw createError({ statusCode: 404, message: 'Ressource non trouvée' });
  }

  const body = await readBody(event);
  const parsed = createSubtaskSchema.safeParse(body);
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: 'Données invalides',
      data: parsed.error.issues,
    });
  }

  const subtask = await prisma.todoSubtask.create({
    data: {
      taskId: taskId!,
      title: parsed.data.title,
      sortOrder: parsed.data.sortOrder ?? 0,
    },
    select: {
      id: true,
      title: true,
      completed: true,
      sortOrder: true,
      createdAt: true,
    },
  });

  setResponseStatus(event, 201);
  return { data: subtask };
});
