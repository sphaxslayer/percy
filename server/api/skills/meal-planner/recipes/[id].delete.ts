/**
 * DELETE /api/skills/meal-planner/recipes/:id — Delete a recipe.
 * Cascade-removes the recipe's ingredients via the Prisma relation,
 * and sets MealSlot.recipeId to null (relation onDelete: SetNull).
 */
export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event);
  const id = getRouterParam(event, 'id');
  if (!id) throw createError({ statusCode: 400, message: 'Identifiant manquant' });

  const owned = await prisma.recipe.findFirst({ where: { id, userId }, select: { id: true } });
  if (!owned) throw createError({ statusCode: 404, message: 'Recette introuvable' });

  await prisma.recipe.delete({ where: { id } });

  return { data: { deleted: true } };
});
