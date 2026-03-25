/**
 * PATCH /api/household/members/:id — Update a household member.
 */
import { z } from 'zod';

const updateMemberSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatar: z.string().max(50).nullable().optional(),
  role: z.string().max(50).nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event);
  const id = getRouterParam(event, 'id');

  const existing = await prisma.householdMember.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    throw createError({ statusCode: 404, message: 'Ressource non trouvée' });
  }

  const body = await readBody(event);
  const parsed = updateMemberSchema.safeParse(body);
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: 'Données invalides',
      data: parsed.error.issues,
    });
  }

  const member = await prisma.householdMember.update({
    where: { id },
    data: parsed.data,
    select: {
      id: true,
      name: true,
      avatar: true,
      role: true,
      sortOrder: true,
      createdAt: true,
    },
  });

  return { data: member };
});
