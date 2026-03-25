/**
 * DELETE /api/skills/todo-at-home/domains/:id — Delete a domain.
 * Cascades: deletes all contexts and their tasks.
 */
export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event);
  const id = getRouterParam(event, 'id');

  const existing = await prisma.todoDomain.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    throw createError({ statusCode: 404, message: 'Ressource non trouvée' });
  }

  await prisma.todoDomain.delete({ where: { id } });

  return { data: { id } };
});
