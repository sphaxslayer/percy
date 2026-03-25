/**
 * PATCH /api/skills/todo-at-home/domains/:id — Update a domain.
 */
import { z } from 'zod';

const updateDomainSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  icon: z.string().max(10).optional(),
  description: z.string().max(500).nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event);
  const id = getRouterParam(event, 'id');

  const existing = await prisma.todoDomain.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    throw createError({ statusCode: 404, message: 'Ressource non trouvée' });
  }

  const body = await readBody(event);
  const parsed = updateDomainSchema.safeParse(body);
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: 'Données invalides',
      data: parsed.error.issues,
    });
  }

  const domain = await prisma.todoDomain.update({
    where: { id },
    data: parsed.data,
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

  return { data: domain };
});
