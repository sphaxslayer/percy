/**
 * DELETE /api/skills/grocery/items/:id — Remove a single grocery item.
 */
import { prisma } from '~/server/utils/prisma'
import { requireUserId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = getRouterParam(event, 'id')

  const existing = await prisma.groceryItem.findUnique({ where: { id } })
  if (!existing || existing.userId !== userId) {
    throw createError({ statusCode: 404, message: 'Ressource non trouvée' })
  }

  await prisma.groceryItem.delete({ where: { id } })

  return { data: { id } }
})
