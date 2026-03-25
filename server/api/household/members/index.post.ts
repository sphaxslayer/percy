/**
 * POST /api/household/members — Create a new household member.
 */
import { z } from 'zod';

const createMemberSchema = z.object({
  name: z.string().min(1).max(100),
  avatar: z.string().max(50).optional(),
  role: z.string().max(50).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event);

  const body = await readBody(event);
  const parsed = createMemberSchema.safeParse(body);
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: 'Données invalides',
      data: parsed.error.issues,
    });
  }

  const member = await prisma.householdMember.create({
    data: {
      userId,
      name: parsed.data.name,
      avatar: parsed.data.avatar,
      role: parsed.data.role,
      sortOrder: parsed.data.sortOrder ?? 0,
    },
    select: {
      id: true,
      name: true,
      avatar: true,
      role: true,
      sortOrder: true,
      createdAt: true,
    },
  });

  setResponseStatus(event, 201);
  return { data: member };
});
