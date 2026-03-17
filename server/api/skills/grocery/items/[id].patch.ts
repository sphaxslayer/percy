/**
 * PATCH /api/skills/grocery/items/:id — Update a grocery item.
 * Supports partial updates: name, quantity, unit, categoryId, checked.
 * When `checked` transitions to true, sets checkedAt automatically.
 */
import { z } from 'zod';

const updateItemSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  quantity: z.number().int().min(1).optional(),
  unit: z.string().max(20).nullable().optional(),
  categoryId: z.string().nullable().optional(),
  checked: z.boolean().optional(),
});

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event);
  const id = getRouterParam(event, 'id');

  const existing = await prisma.groceryItem.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    throw createError({ statusCode: 404, message: 'Ressource non trouvée' });
  }

  const body = await readBody(event);
  const parsed = updateItemSchema.safeParse(body);
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: 'Données invalides',
      data: parsed.error.issues,
    });
  }

  const data: Record<string, unknown> = { ...parsed.data };

  // Auto-set checkedAt when checking/unchecking
  if (parsed.data.checked === true && !existing.checked) {
    data.checkedAt = new Date();
  } else if (parsed.data.checked === false) {
    data.checkedAt = null;
  }

  const item = await prisma.groceryItem.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      quantity: true,
      unit: true,
      categoryId: true,
      category: { select: { id: true, name: true, sortOrder: true } },
      checked: true,
      checkedAt: true,
      sortOrder: true,
      createdAt: true,
    },
  });

  return { data: item };
});
