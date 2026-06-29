/**
 * POST /api/skills/meal-planner/meal-slots — Create or replace a meal slot.
 *
 * Uses upsert on (userId, date, mealType) so re-assigning a recipe to a slot
 * the user already filled in just updates that slot — the UI doesn't need to
 * worry about whether the slot exists yet.
 */
import { z } from 'zod';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

const bodySchema = z.object({
  date: z.string().min(1),
  mealType: z.enum(MEAL_TYPES),
  recipeId: z.string().nullable().optional(),
  servings: z.number().int().min(1).max(50).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

function startOfDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event);

  const parsed = bodySchema.safeParse(await readBody(event));
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'Données invalides', data: parsed.error.issues });
  }

  // Validate recipe ownership when provided.
  if (parsed.data.recipeId) {
    const owned = await prisma.recipe.findFirst({
      where: { id: parsed.data.recipeId, userId },
      select: { id: true },
    });
    if (!owned) throw createError({ statusCode: 404, message: 'Recette introuvable' });
  }

  const date = startOfDay(new Date(parsed.data.date));

  const slot = await prisma.mealSlot.upsert({
    where: {
      userId_date_mealType: { userId, date, mealType: parsed.data.mealType },
    },
    create: {
      userId,
      date,
      mealType: parsed.data.mealType,
      recipeId: parsed.data.recipeId ?? null,
      servings: parsed.data.servings ?? null,
      notes: parsed.data.notes ?? null,
    },
    update: {
      recipeId: parsed.data.recipeId ?? null,
      servings: parsed.data.servings ?? null,
      notes: parsed.data.notes ?? null,
    },
    include: {
      recipe: { include: { ingredients: { orderBy: { sortOrder: 'asc' } } } },
    },
  });

  return { data: slot };
});
