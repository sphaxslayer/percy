/**
 * POST /api/skills/meal-planner/recipes — Create a recipe.
 * Optionally accepts an `ingredients` array to seed the recipe in one call.
 */
import { z } from 'zod';

const ingredientSchema = z.object({
  name: z.string().min(1).max(120),
  quantity: z.number().positive().nullable().optional(),
  unit: z.string().max(20).nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

const bodySchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(2000).nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  servings: z.number().int().min(1).max(50).optional(),
  prepMinutes: z.number().int().min(0).max(1440).nullable().optional(),
  cookMinutes: z.number().int().min(0).max(1440).nullable().optional(),
  ingredients: z.array(ingredientSchema).optional(),
});

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event);

  const parsed = bodySchema.safeParse(await readBody(event));
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'Données invalides', data: parsed.error.issues });
  }

  const { ingredients, ...recipeData } = parsed.data;

  const recipe = await prisma.recipe.create({
    data: {
      ...recipeData,
      userId,
      ingredients: ingredients
        ? {
            create: ingredients.map((ing, index) => ({
              name: ing.name,
              quantity: ing.quantity ?? null,
              unit: ing.unit ?? null,
              sortOrder: ing.sortOrder ?? index,
            })),
          }
        : undefined,
    },
    include: {
      ingredients: { orderBy: { sortOrder: 'asc' } },
    },
  });

  return { data: recipe };
});
