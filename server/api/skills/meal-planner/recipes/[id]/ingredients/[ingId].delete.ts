/**
 * DELETE /api/skills/meal-planner/recipes/:id/ingredients/:ingId — Remove an ingredient.
 */
export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event);
  const recipeId = getRouterParam(event, 'id');
  const ingId = getRouterParam(event, 'ingId');
  if (!recipeId || !ingId) throw createError({ statusCode: 400, message: 'Identifiant manquant' });

  const ingredient = await prisma.recipeIngredient.findFirst({
    where: { id: ingId, recipeId, recipe: { userId } },
    select: { id: true },
  });
  if (!ingredient) throw createError({ statusCode: 404, message: 'Ingrédient introuvable' });

  await prisma.recipeIngredient.delete({ where: { id: ingId } });

  return { data: { deleted: true } };
});
