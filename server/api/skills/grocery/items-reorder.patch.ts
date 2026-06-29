/**
 * PATCH /api/skills/grocery/items-reorder
 * Updates sortOrder for a batch of grocery items in a single transaction.
 * Body: { items: Array<{ id: string; sortOrder: number }> }
 */
import { handleReorder } from '~~/server/utils/reorder';

export default defineEventHandler((event) =>
  handleReorder(event, {
    findOwnedIds: (userId, ids) =>
      prisma.groceryItem.findMany({
        where: { id: { in: ids }, userId },
        select: { id: true },
      }),
    updateSortOrder: (id, sortOrder) =>
      prisma.groceryItem.update({ where: { id }, data: { sortOrder } }),
  }),
);
