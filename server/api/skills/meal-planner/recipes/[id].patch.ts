/**
 * PATCH /api/skills/meal-planner/recipes/:id — Update recipe metadata.
 * Ingredients are managed via the nested endpoints.
 */
import { z } from 'zod';

const bodySchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(2000).nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  servings: z.number().int().min(1).max(50).optional(),
  prepMinutes: z.number().int().min(0).max(1440).nullable().optional(),
  cookMinutes: z.number().int().min(0).max(1440).nullable().optional(),
});

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event);
  const id = getRouterParam(event, 'id');
  if (!id) throw createError({ statusCode: 400, message: 'Identifiant manquant' });

  const owned = await prisma.recipe.findFirst({ where: { id, userId }, select: { id: true } });
  if (!owned) throw createError({ statusCode: 404, message: 'Recette introuvable' });

  const parsed = bodySchema.safeParse(await readBody(event));
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'Données invalides', data: parsed.error.issues });
  }

  const recipe = await prisma.recipe.update({
    where: { id },
    data: parsed.data,
    include: { ingredients: { orderBy: { sortOrder: 'asc' } } },
  });

  return { data: recipe };
});
