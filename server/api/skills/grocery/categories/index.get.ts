/**
 * GET /api/skills/grocery/categories — List the user's grocery categories.
 * Sorted by sortOrder for consistent display.
 */
export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)

  const categories = await prisma.groceryCategory.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      sortOrder: true,
      _count: { select: { items: true } },
    },
    orderBy: { sortOrder: 'asc' },
  })

  return { data: categories }
})
