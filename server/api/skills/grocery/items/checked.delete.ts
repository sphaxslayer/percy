/**
 * DELETE /api/skills/grocery/items/checked — Remove all checked items for the current user.
 * Used by the "Vider" button in the "Déjà acheté" section.
 */
export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event);

  const result = await prisma.groceryItem.deleteMany({
    where: { userId, checked: true },
  });

  return { data: { deletedCount: result.count } };
});
