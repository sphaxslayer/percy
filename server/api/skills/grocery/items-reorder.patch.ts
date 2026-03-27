/**
 * PATCH /api/skills/grocery/items/reorder
 * Updates sortOrder for a batch of grocery items in a single transaction.
 * Body: { items: Array<{ id: string; sortOrder: number }> }
 */
import { z } from 'zod';

const reorderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().min(1),
      sortOrder: z.number().int().min(0),
    }),
  ).min(1),
});

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event);

  const body = await readBody(event);
  const parsed = reorderSchema.safeParse(body);
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'Données invalides', data: parsed.error.issues });
  }

  const ids = parsed.data.items.map((i) => i.id);
  const owned = await prisma.groceryItem.findMany({
    where: { id: { in: ids }, userId },
    select: { id: true },
  });
  if (owned.length !== ids.length) {
    throw createError({ statusCode: 403, message: 'Accès refusé' });
  }

  await prisma.$transaction(
    parsed.data.items.map(({ id, sortOrder }) =>
      prisma.groceryItem.update({ where: { id }, data: { sortOrder } }),
    ),
  );

  return { data: { updated: ids.length } };
});
