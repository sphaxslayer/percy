/**
 * DELETE /api/household/members/:id — Delete a household member.
 * Tasks assigned to this member will have their assigneeId set to null (DB cascade).
 */
export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event);
  const id = getRouterParam(event, 'id');

  const existing = await prisma.householdMember.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    throw createError({ statusCode: 404, message: 'Ressource non trouvée' });
  }

  await prisma.householdMember.delete({ where: { id } });

  return { data: { id } };
});
