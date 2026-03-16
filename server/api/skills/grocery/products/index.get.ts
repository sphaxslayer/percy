/**
 * GET /api/skills/grocery/products — List the user's product catalog.
 * Used for autocomplete, sorted by usageCount descending (most used first).
 * Supports optional ?search= query parameter for filtering.
 */
import { prisma } from '~/server/utils/prisma'
import { requireUserId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const query = getQuery(event)
  const search = typeof query.search === 'string' ? query.search.trim() : ''

  const products = await prisma.groceryProduct.findMany({
    where: {
      userId,
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
    },
    select: {
      id: true,
      name: true,
      categoryId: true,
      category: { select: { id: true, name: true } },
      usageCount: true,
    },
    orderBy: { usageCount: 'desc' },
    take: 20,
  })

  return { data: products }
})
