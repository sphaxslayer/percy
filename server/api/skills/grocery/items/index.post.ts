/**
 * POST /api/skills/grocery/items — Add a new item to the grocery list.
 * Also creates/updates the corresponding GroceryProduct in the user's catalog
 * (for autocomplete, sorted by usage frequency).
 */
import { z } from 'zod'

const createItemSchema = z.object({
  name: z.string().min(1).max(255),
  quantity: z.number().int().min(1).default(1),
  unit: z.string().max(20).optional(),
  categoryId: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)

  const body = await readBody(event)
  const parsed = createItemSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: 'Données invalides',
      data: parsed.error.issues,
    })
  }

  const { name, quantity, unit, categoryId } = parsed.data

  // Validate category ownership if provided
  if (categoryId) {
    const category = await prisma.groceryCategory.findUnique({ where: { id: categoryId } })
    if (!category || category.userId !== userId) {
      throw createError({ statusCode: 400, message: 'Catégorie invalide' })
    }
  }

  // Create the item + upsert the product catalog entry in a transaction
  const [item] = await prisma.$transaction([
    prisma.groceryItem.create({
      data: { userId, name, quantity, unit, categoryId },
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
    }),
    // Upsert product in catalog: create if new, increment usageCount if exists
    prisma.groceryProduct.upsert({
      where: { userId_name: { userId, name } },
      create: { userId, name, categoryId, usageCount: 1 },
      update: { usageCount: { increment: 1 }, categoryId: categoryId ?? undefined },
    }),
  ])

  setResponseStatus(event, 201)
  return { data: item }
})
