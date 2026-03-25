/**
 * POST /api/skills/todo-at-home/domains — Create a new domain.
 * Automatically creates a "Global" context for the domain.
 */
import { z } from 'zod';

const createDomainSchema = z.object({
  name: z.string().min(1).max(100),
  icon: z.string().max(10).optional(),
  description: z.string().max(500).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event);

  const body = await readBody(event);
  const parsed = createDomainSchema.safeParse(body);
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: 'Données invalides',
      data: parsed.error.issues,
    });
  }

  // Create domain + its Global context in a transaction
  const domain = await prisma.$transaction(async (tx) => {
    const created = await tx.todoDomain.create({
      data: {
        userId,
        name: parsed.data.name,
        icon: parsed.data.icon ?? '🏠',
        description: parsed.data.description,
        sortOrder: parsed.data.sortOrder ?? 0,
      },
    });

    await tx.todoContext.create({
      data: {
        userId,
        domainId: created.id,
        name: 'Global',
        icon: '🏠',
        isGlobal: true,
        sortOrder: 0,
      },
    });

    return tx.todoDomain.findUniqueOrThrow({
      where: { id: created.id },
      select: {
        id: true,
        name: true,
        icon: true,
        description: true,
        sortOrder: true,
        createdAt: true,
        _count: { select: { contexts: true } },
      },
    });
  });

  setResponseStatus(event, 201);
  return { data: domain };
});
