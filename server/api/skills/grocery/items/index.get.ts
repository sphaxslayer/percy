/**
 * GET /api/skills/grocery/items — List all grocery items for the current user.
 * Returns both active (unchecked) and checked items, with category info.
 */
import { prisma } from '~/server/utils/prisma'
import { requireUserId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)

  const items = await prisma.groceryItem.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      quantity: true,
      unit: true,
      categoryId: true,
      category: { select: { id: true, name: true, sortOrder: true } },
      checked: true,
      checkedAt: true,
      sortOrder: true,
      createdAt: true,
    },
    orderBy: [{ checked: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
  })

  return { data: items }
})
