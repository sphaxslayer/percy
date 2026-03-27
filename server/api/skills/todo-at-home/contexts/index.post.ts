/**
 * POST /api/skills/todo-at-home/contexts — Create a new context in a domain.
 */
import { z } from 'zod';

const createContextSchema = z.object({
  domainId: z.string().min(1),
  name: z.string().min(1).max(100),
  icon: z.string().max(10).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  imageUrl: z.string().max(500).nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event);

  const body = await readBody(event);
  const parsed = createContextSchema.safeParse(body);
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: 'Données invalides',
      data: parsed.error.issues,
    });
  }

  // Verify domain ownership
  const domain = await prisma.todoDomain.findUnique({
    where: { id: parsed.data.domainId },
  });
  if (!domain || domain.userId !== userId) {
    throw createError({ statusCode: 400, message: 'Domaine invalide' });
  }

  const context = await prisma.todoContext.create({
    data: {
      userId,
      domainId: parsed.data.domainId,
      name: parsed.data.name,
      icon: parsed.data.icon,
      color: parsed.data.color ?? '#F59E0B',
      imageUrl: parsed.data.imageUrl ?? null,
      sortOrder: parsed.data.sortOrder ?? 0,
    },
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

  setResponseStatus(event, 201);
  return { data: context };
});
