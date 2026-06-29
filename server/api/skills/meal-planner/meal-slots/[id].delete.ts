/**
 * DELETE /api/skills/meal-planner/meal-slots/:id — Delete a meal slot.
 */
export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event);
  const id = getRouterParam(event, 'id');
  if (!id) throw createError({ statusCode: 400, message: 'Identifiant manquant' });

  const owned = await prisma.mealSlot.findFirst({ where: { id, userId }, select: { id: true } });
  if (!owned) throw createError({ statusCode: 404, message: 'Créneau introuvable' });

  await prisma.mealSlot.delete({ where: { id } });

  return { data: { deleted: true } };
});
