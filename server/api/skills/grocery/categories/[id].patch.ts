/**
 * PATCH /api/skills/grocery/categories/:id — Update a grocery category.
 */
import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { requireUserId } from '~/server/utils/auth'

const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  sortOrder: z.number().int().min(0).optional(),
})

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = getRouterParam(event, 'id')

  const existing = await prisma.groceryCategory.findUnique({ where: { id } })
  if (!existing || existing.userId !== userId) {
    throw createError({ statusCode: 404, message: 'Ressource non trouvée' })
  }

  const body = await readBody(event)
  const parsed = updateCategorySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: 'Données invalides',
      data: parsed.error.issues,
    })
  }

  // If renaming, check for duplicate
  if (parsed.data.name && parsed.data.name !== existing.name) {
    const duplicate = await prisma.groceryCategory.findUnique({
      where: { userId_name: { userId, name: parsed.data.name } },
    })
    if (duplicate) {
      throw createError({ statusCode: 400, message: 'Cette catégorie existe déjà' })
    }
  }

  const category = await prisma.groceryCategory.update({
    where: { id },
    data: parsed.data,
    select: { id: true, name: true, sortOrder: true },
  })

  return { data: category }
})
