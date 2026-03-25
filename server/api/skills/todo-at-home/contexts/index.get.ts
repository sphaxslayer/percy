/**
 * GET /api/skills/todo-at-home/contexts — List contexts, optionally filtered by domainId.
 */
import { z } from 'zod';

const querySchema = z.object({
  domainId: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event);

  const query = getQuery(event);
  const parsed = querySchema.safeParse(query);
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: 'Paramètres invalides',
      data: parsed.error.issues,
    });
  }

  const where: { userId: string; domainId?: string } = { userId };
  if (parsed.data.domainId) {
    where.domainId = parsed.data.domainId;
  }

  const contexts = await prisma.todoContext.findMany({
    where,
    select: {
      id: true,
      domainId: true,
      name: true,
      icon: true,
      color: true,
      imageUrl: true,
      sortOrder: true,
      isGlobal: true,
      createdAt: true,
      _count: { select: { tasks: true } },
    },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });

  return { data: contexts };
});
