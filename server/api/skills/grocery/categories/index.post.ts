/**
 * POST /api/skills/grocery/categories — Create a new grocery category.
 */
import { z } from 'zod'

const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  sortOrder: z.number().int().min(0).default(0),
})

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)

  const body = await readBody(event)
  const parsed = createCategorySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: 'Données invalides',
      data: parsed.error.issues,
    })
  }

  // Check for duplicate name
  const existing = await prisma.groceryCategory.findUnique({
    where: { userId_name: { userId, name: parsed.data.name } },
  })
  if (existing) {
    throw createError({ statusCode: 400, message: 'Cette catégorie existe déjà' })
  }

  const category = await prisma.groceryCategory.create({
    data: { userId, ...parsed.data },
    select: { id: true, name: true, sortOrder: true },
  })

  setResponseStatus(event, 201)
  return { data: category }
})
