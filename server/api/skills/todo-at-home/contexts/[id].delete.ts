/**
 * DELETE /api/skills/todo-at-home/contexts/:id — Delete a context.
 * Cannot delete the Global context. When deleting a non-global context,
 * all its tasks are migrated to the domain's Global context.
 */
export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event);
  const id = getRouterParam(event, 'id');

  const existing = await prisma.todoContext.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    throw createError({ statusCode: 404, message: 'Ressource non trouvée' });
  }

  if (existing.isGlobal) {
    throw createError({
      statusCode: 400,
      message: 'Impossible de supprimer le contexte Global',
    });
  }

  // Find the Global context for this domain to migrate tasks
  const globalContext = await prisma.todoContext.findFirst({
    where: { domainId: existing.domainId, userId, isGlobal: true },
  });

  if (!globalContext) {
    throw createError({
      statusCode: 500,
      message: 'Contexte Global introuvable pour ce domaine',
    });
  }

  // Migrate tasks to Global then delete context
  await prisma.$transaction([
    prisma.todoTask.updateMany({
      where: { contextId: id },
      data: { contextId: globalContext.id },
    }),
    prisma.todoContext.delete({ where: { id } }),
  ]);

  return { data: { id } };
});
