/**
 * POST /api/skills/meal-planner/recipes/:id/ingredients — Add an ingredient to a recipe.
 */
import { z } from 'zod';

const bodySchema = z.object({
  name: z.string().min(1).max(120),
  quantity: z.number().positive().nullable().optional(),
  unit: z.string().max(20).nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event);
  const recipeId = getRouterParam(event, 'id');
  if (!recipeId) throw createError({ statusCode: 400, message: 'Identifiant manquant' });

  const owned = await prisma.recipe.findFirst({ where: { id: recipeId, userId }, select: { id: true } });
  if (!owned) throw createError({ statusCode: 404, message: 'Recette introuvable' });

  const parsed = bodySchema.safeParse(await readBody(event));
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'Données invalides', data: parsed.error.issues });
  }

  // Default sortOrder to the end of the list if not provided.
  let sortOrder = parsed.data.sortOrder;
  if (sortOrder === undefined) {
    const last = await prisma.recipeIngredient.findFirst({
      where: { recipeId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });
    sortOrder = (last?.sortOrder ?? -1) + 1;
  }

  const ingredient = await prisma.recipeIngredient.create({
    data: {
      recipeId,
      name: parsed.data.name,
      quantity: parsed.data.quantity ?? null,
      unit: parsed.data.unit ?? null,
      sortOrder,
    },
  });

  return { data: ingredient };
});
