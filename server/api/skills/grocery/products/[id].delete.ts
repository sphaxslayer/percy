/**
 * DELETE /api/skills/grocery/products/:id — Remove a product from the catalog.
 * Does NOT remove existing items on the grocery list that used this product.
 */
export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event);
  const id = getRouterParam(event, 'id');

  const existing = await prisma.groceryProduct.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    throw createError({ statusCode: 404, message: 'Ressource non trouvée' });
  }

  await prisma.groceryProduct.delete({ where: { id } });

  return { data: { id } };
});
