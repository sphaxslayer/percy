/**
 * POST /api/skills/todo-at-home/seed — Initialize default data for a new user.
 * Creates domain "Maison" + Global context + suggested contexts + member "Moi".
 * Idempotent: skips if data already exists.
 */
export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event);

  // Check if user already has domains — if so, skip seeding
  const existingDomains = await prisma.todoDomain.count({ where: { userId } });
  if (existingDomains > 0) {
    return { data: { seeded: false, message: 'Données déjà initialisées' } };
  }

  const suggestedContexts = [
    { name: 'Cuisine', icon: '🍳', color: '#F59E0B' },
    { name: 'Salon', icon: '🛋️', color: '#3B82F6' },
    { name: 'Chambre', icon: '🛏️', color: '#8B5CF6' },
    { name: 'Salle de bain', icon: '🚿', color: '#10B981' },
    { name: 'Bureau', icon: '💼', color: '#F97316' },
  ];

  await prisma.$transaction(async (tx) => {
    // Create domain
    const domain = await tx.todoDomain.create({
      data: {
        userId,
        name: 'Maison',
        icon: '🏠',
        description: 'Tâches domestiques',
      },
    });

    // Create Global context
    await tx.todoContext.create({
      data: {
        userId,
        domainId: domain.id,
        name: 'Global',
        icon: '🏠',
        isGlobal: true,
        sortOrder: 0,
      },
    });

    // Create suggested contexts
    for (let i = 0; i < suggestedContexts.length; i++) {
      const ctx = suggestedContexts[i]!;
      await tx.todoContext.create({
        data: {
          userId,
          domainId: domain.id,
          name: ctx.name,
          icon: ctx.icon,
          color: ctx.color,
          sortOrder: i + 1,
        },
      });
    }

    // Create default member "Moi" if none exist
    const existingMembers = await tx.householdMember.count({ where: { userId } });
    if (existingMembers === 0) {
      await tx.householdMember.create({
        data: {
          userId,
          name: 'Moi',
          avatar: '👤',
          role: 'parent',
          sortOrder: 0,
        },
      });
    }
  });

  return { data: { seeded: true, message: 'Données initiales créées' } };
});
