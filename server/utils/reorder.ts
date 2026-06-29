/**
 * server/utils/reorder.ts — Shared helper for bulk sortOrder updates.
 *
 * Several reorder endpoints (grocery items, todo contexts, future skills…)
 * follow the exact same shape:
 *   1. Validate body with the same Zod schema.
 *   2. Check that every id belongs to the current user.
 *   3. Run all sortOrder updates inside a single transaction.
 *
 * Each consumer plugs in its own model-specific lookup and update callbacks,
 * keeping Prisma's typed accessors out of the generic layer.
 */
import { z } from 'zod';
import type { H3Event } from 'h3';
import type { Prisma } from '~~/generated/prisma/client';

export const reorderSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        sortOrder: z.number().int().min(0),
      }),
    )
    .min(1),
});

export interface ReorderHelpers {
  /** Return the rows actually owned by the user, filtered by the given ids. */
  findOwnedIds: (userId: string, ids: string[]) => Promise<{ id: string }[]>;
  /**
   * Build a PrismaPromise that updates a single row's sortOrder.
   * The promises are combined into one prisma.$transaction call.
   */
  updateSortOrder: (id: string, sortOrder: number) => Prisma.PrismaPromise<unknown>;
}

/**
 * Run the shared validate → authorise → transactional update flow.
 * Returns the standard `{ data: { updated } }` payload so consumers can just
 * `return handleReorder(event, helpers)`.
 */
export async function handleReorder(event: H3Event, helpers: ReorderHelpers) {
  const userId = await requireUserId(event);
  const parsed = reorderSchema.safeParse(await readBody(event));
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: 'Données invalides',
      data: parsed.error.issues,
    });
  }

  const ids = parsed.data.items.map((i) => i.id);
  const owned = await helpers.findOwnedIds(userId, ids);
  if (owned.length !== ids.length) {
    throw createError({ statusCode: 403, message: 'Accès refusé' });
  }

  await prisma.$transaction(
    parsed.data.items.map(({ id, sortOrder }) => helpers.updateSortOrder(id, sortOrder)),
  );

  return { data: { updated: ids.length } };
}
