/**
 * PATCH /api/skills/meal-planner/recipes/:id/ingredients/:ingId — Update an ingredient.
 */
import { z } from 'zod';

const bodySchema = z.object({
  name: z.string().min(1).max(120).optional(),
  quantity: z.number().positive().nullable().optional(),
  unit: z.string().max(20).nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event);
  const recipeId = getRouterParam(event, 'id');
  const ingId = getRouterParam(event, 'ingId');
  if (!recipeId || !ingId) throw createError({ statusCode: 400, message: 'Identifiant manquant' });

  // Verify ownership through the parent recipe.
  const ingredient = await prisma.recipeIngredient.findFirst({
    where: { id: ingId, recipeId, recipe: { userId } },
    select: { id: true },
  });
  if (!ingredient) throw createError({ statusCode: 404, message: 'Ingrédient introuvable' });

  const parsed = bodySchema.safeParse(await readBody(event));
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'Données invalides', data: parsed.error.issues });
  }

  const updated = await prisma.recipeIngredient.update({
    where: { id: ingId },
    data: parsed.data,
  });

  return { data: updated };
});
