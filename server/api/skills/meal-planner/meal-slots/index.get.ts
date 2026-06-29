/**
 * GET /api/skills/meal-planner/meal-slots — List meal slots for a date range.
 *
 * Query params:
 *   - from (ISO date) inclusive
 *   - to   (ISO date) inclusive
 *
 * Both default to the current week (Monday → Sunday in the server's local TZ).
 */
import { z } from 'zod';

const querySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

function startOfDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event);

  const parsed = querySchema.safeParse(getQuery(event));
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'Paramètres invalides' });
  }

  const now = new Date();
  const monday = new Date(now);
  const dayOfWeek = (monday.getUTCDay() + 6) % 7; // Monday = 0
  monday.setUTCDate(monday.getUTCDate() - dayOfWeek);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);

  const from = parsed.data.from ? startOfDay(new Date(parsed.data.from)) : startOfDay(monday);
  const to = parsed.data.to ? startOfDay(new Date(parsed.data.to)) : startOfDay(sunday);

  const slots = await prisma.mealSlot.findMany({
    where: {
      userId,
      date: { gte: from, lte: to },
    },
    include: {
      recipe: {
        include: { ingredients: { orderBy: { sortOrder: 'asc' } } },
      },
    },
    orderBy: [{ date: 'asc' }, { mealType: 'asc' }],
  });

  return { data: slots };
});
