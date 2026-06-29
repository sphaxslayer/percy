/**
 * POST /api/skills/meal-planner/recipes/:id/push-to-grocery
 *
 * Cross-skill bridge: copy every ingredient of a recipe into the active
 * grocery list. Each ingredient becomes a GroceryItem (unchecked) and the
 * user's product catalog is updated so the autocomplete learns the name.
 *
 * Body: { servingsMultiplier?: number } — scales quantities (defaults to 1).
 */
import { z } from 'zod';

const bodySchema = z.object({
  servingsMultiplier: z.number().positive().max(50).optional(),
});

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event);
  const recipeId = getRouterParam(event, 'id');
  if (!recipeId) throw createError({ statusCode: 400, message: 'Identifiant manquant' });

  const recipe = await prisma.recipe.findFirst({
    where: { id: recipeId, userId },
    include: { ingredients: true },
  });
  if (!recipe) throw createError({ statusCode: 404, message: 'Recette introuvable' });

  const parsed = bodySchema.safeParse(await readBody(event));
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'Données invalides', data: parsed.error.issues });
  }
  const multiplier = parsed.data.servingsMultiplier ?? 1;

  if (recipe.ingredients.length === 0) {
    return { data: { added: 0 } };
  }

  // Compute the next sortOrder for the user's items: append at the bottom.
  const lastItem = await prisma.groceryItem.findFirst({
    where: { userId },
    orderBy: { sortOrder: 'desc' },
    select: { sortOrder: true },
  });
  let nextOrder = (lastItem?.sortOrder ?? -1) + 1;

  const created = await prisma.$transaction(
    recipe.ingredients.map((ing) => {
      const scaledQty = ing.quantity ? Math.max(1, Math.round(ing.quantity * multiplier)) : 1;
      const order = nextOrder++;
      return prisma.groceryItem.create({
        data: {
          userId,
          name: ing.name,
          quantity: scaledQty,
          unit: ing.unit ?? null,
          sortOrder: order,
        },
      });
    }),
  );

  // Best-effort: bump usageCount in the personal product catalog for autocomplete.
  await Promise.all(
    recipe.ingredients.map((ing) =>
      prisma.groceryProduct.upsert({
        where: { userId_name: { userId, name: ing.name } },
        create: { userId, name: ing.name },
        update: { usageCount: { increment: 1 } },
      }),
    ),
  );

  return { data: { added: created.length } };
});
