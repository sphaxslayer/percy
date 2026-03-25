/**
 * PATCH /api/skills/todo-at-home/contexts/:id — Update a context.
 */
import { z } from 'zod';

const updateContextSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  icon: z.string().max(10).nullable().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event);
  const id = getRouterParam(event, 'id');

  const existing = await prisma.todoContext.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    throw createError({ statusCode: 404, message: 'Ressource non trouvée' });
  }

  const body = await readBody(event);
  const parsed = updateContextSchema.safeParse(body);
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: 'Données invalides',
      data: parsed.error.issues,
    });
  }

  const context = await prisma.todoContext.update({
    where: { id },
    data: parsed.data,
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
  });

  return { data: context };
});
