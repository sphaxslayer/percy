/**
 * PATCH /api/skills/todo-at-home/contexts-reorder
 * Updates sortOrder for a batch of contexts in a single transaction.
 * Body: { items: Array<{ id: string; sortOrder: number }> }
 */
import { handleReorder } from '~~/server/utils/reorder';

export default defineEventHandler((event) =>
  handleReorder(event, {
    findOwnedIds: (userId, ids) =>
      prisma.todoContext.findMany({
        where: { id: { in: ids }, userId },
        select: { id: true },
      }),
    updateSortOrder: (id, sortOrder) =>
      prisma.todoContext.update({ where: { id }, data: { sortOrder } }),
  }),
);
