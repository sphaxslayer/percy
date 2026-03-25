/**
 * PATCH /api/skills/todo-at-home/tasks/:taskId/subtasks/:id — Update a subtask.
 */
import { z } from 'zod';

const updateSubtaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  completed: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event);
  const taskId = getRouterParam(event, 'taskId');
  const id = getRouterParam(event, 'id');

  // Verify task ownership
  const task = await prisma.todoTask.findUnique({ where: { id: taskId } });
  if (!task || task.userId !== userId) {
    throw createError({ statusCode: 404, message: 'Ressource non trouvée' });
  }

  // Verify subtask belongs to task
  const existing = await prisma.todoSubtask.findUnique({ where: { id } });
  if (!existing || existing.taskId !== taskId) {
    throw createError({ statusCode: 404, message: 'Ressource non trouvée' });
  }

  const body = await readBody(event);
  const parsed = updateSubtaskSchema.safeParse(body);
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: 'Données invalides',
      data: parsed.error.issues,
    });
  }

  const subtask = await prisma.todoSubtask.update({
    where: { id },
    data: parsed.data,
    select: {
      id: true,
      title: true,
      completed: true,
      sortOrder: true,
      createdAt: true,
    },
  });

  return { data: subtask };
});
