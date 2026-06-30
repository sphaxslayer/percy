/**
 * PATCH /api/skills/grocery/categories-reorder
 * Updates sortOrder for a batch of grocery categories in a single transaction.
 * Body: { items: Array<{ id: string; sortOrder: number }> }
 */
import { handleReorder } from '~~/server/utils/reorder';

export default defineEventHandler((event) =>
  handleReorder(event, {
    findOwnedIds: (userId, ids) =>
      prisma.groceryCategory.findMany({
        where: { id: { in: ids }, userId },
        select: { id: true },
      }),
    updateSortOrder: (id, sortOrder) =>
      prisma.groceryCategory.update({ where: { id }, data: { sortOrder } }),
  }),
);
