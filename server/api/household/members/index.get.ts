/**
 * GET /api/household/members — List all household members for the current user.
 */
export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event);

  const members = await prisma.householdMember.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      avatar: true,
      role: true,
      sortOrder: true,
      createdAt: true,
    },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });

  return { data: members };
});
