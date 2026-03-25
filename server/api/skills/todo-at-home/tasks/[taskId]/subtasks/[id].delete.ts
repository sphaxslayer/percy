/**
 * DELETE /api/skills/todo-at-home/tasks/:taskId/subtasks/:id — Delete a subtask.
 */
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

  await prisma.todoSubtask.delete({ where: { id } });

  return { data: { id } };
});
