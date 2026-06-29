/**
 * GET /api/skills/meal-planner/recipes — List all recipes for the current user.
 * Includes ingredients in sortOrder ascending.
 */
export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event);

  const recipes = await prisma.recipe.findMany({
    where: { userId },
    include: {
      ingredients: { orderBy: { sortOrder: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return { data: recipes };
});
