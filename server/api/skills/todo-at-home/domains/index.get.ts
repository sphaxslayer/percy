/**
 * GET /api/skills/todo-at-home/domains — List all domains for the current user.
 */
export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event);

  const domains = await prisma.todoDomain.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      icon: true,
      description: true,
      sortOrder: true,
      createdAt: true,
      _count: { select: { contexts: true } },
    },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });

  return { data: domains };
});
