/**
 * DELETE /api/skills/todo-at-home/tasks/:id — Delete a task.
 * Cascades: deletes all subtasks.
 */
export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event);
  const id = getRouterParam(event, 'id');

  const existing = await prisma.todoTask.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    throw createError({ statusCode: 404, message: 'Ressource non trouvée' });
  }

  await prisma.todoTask.delete({ where: { id } });

  return { data: { id } };
});
