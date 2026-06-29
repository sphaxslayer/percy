/**
 * PATCH /api/skills/meal-planner/meal-slots/:id — Update a meal slot.
 * Only servings, notes and recipeId can be changed (date+mealType are the key).
 */
import { z } from 'zod';

const bodySchema = z.object({
  recipeId: z.string().nullable().optional(),
  servings: z.number().int().min(1).max(50).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event);
  const id = getRouterParam(event, 'id');
  if (!id) throw createError({ statusCode: 400, message: 'Identifiant manquant' });

  const owned = await prisma.mealSlot.findFirst({ where: { id, userId }, select: { id: true } });
  if (!owned) throw createError({ statusCode: 404, message: 'Créneau introuvable' });

  const parsed = bodySchema.safeParse(await readBody(event));
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'Données invalides', data: parsed.error.issues });
  }

  if (parsed.data.recipeId) {
    const ownedRecipe = await prisma.recipe.findFirst({
      where: { id: parsed.data.recipeId, userId },
      select: { id: true },
    });
    if (!ownedRecipe) throw createError({ statusCode: 404, message: 'Recette introuvable' });
  }

  const slot = await prisma.mealSlot.update({
    where: { id },
    data: parsed.data,
    include: { recipe: { include: { ingredients: { orderBy: { sortOrder: 'asc' } } } } },
  });

  return { data: slot };
});
