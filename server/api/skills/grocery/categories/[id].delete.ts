/**
 * DELETE /api/skills/grocery/categories/:id — Delete a grocery category.
 * Items and products in this category get their categoryId set to null
 * (handled by Prisma's onDelete: SetNull in the schema).
 */
export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event);
  const id = getRouterParam(event, 'id');

  const existing = await prisma.groceryCategory.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    throw createError({ statusCode: 404, message: 'Ressource non trouvée' });
  }

  await prisma.groceryCategory.delete({ where: { id } });

  return { data: { id } };
});
