# Prompt Claude Code — Skill TodoAtHome

## Contexte
Ce prompt est à utiliser dans Claude Code APRÈS que le socle Percy soit bootstrappé.
Lance une nouvelle session Claude Code et colle le contenu de la section PROMPT.

---

## PROMPT

```
Lis ces fichiers dans l'ordre :
1. agent_docs/architecture.md
2. agent_docs/skill_spec_todo_at_home.md
3. agent_docs/frontend_conventions.md
4. agent_docs/backend_conventions.md
5. agent_docs/ux_ui_guidelines.md

Implémente le skill "TodoAtHome" tel que spécifié dans skill_spec_todo_at_home.md.

Suis la checklist "Adding a New Skill" de architecture.md.
Crée une branche feature/todo-at-home.

ATTENTION — Modèle partagé :
Le modèle HouseholdMember est un modèle PARTAGÉ entre skills (pas spécifique à TodoAtHome).
Ses routes API sont sous /api/household/members (pas sous /api/skills/todo-at-home/).
Son composable est dans composables/use-household-members.ts (pas dans un dossier skill).

Procède en 5 phases séquentielles. Valide chaque phase avec moi avant de passer à la suivante.

PHASE A — Modèle de données & migrations
- Ajoute les modèles Prisma : HouseholdMember, TodoDomain, TodoContext, TodoTask, TodoSubtask
- HouseholdMember est hors du skill (modèle partagé). Si il existe déjà (ajouté par un autre skill), ne le recrée pas.
- Crée la migration Prisma
- Vérifie que les relations et les cascades de suppression sont correctes

PHASE B — API routes
- Implémente les routes /api/household/members (CRUD)
- Implémente les routes /api/skills/todo-at-home/domains (CRUD)
- Implémente les routes /api/skills/todo-at-home/contexts (CRUD, avec logique : suppression d'un contexte migre les tâches vers le contexte Global du domaine)
- Implémente les routes /api/skills/todo-at-home/tasks (CRUD + filtres complets : contextId, domainId, status, priority, assigneeId, search, sort, order, withDueDate)
- Implémente les routes /api/skills/todo-at-home/tasks/:taskId/subtasks (CRUD)
- Valide TOUS les inputs avec Zod
- Vérifie l'auth et scope par userId sur CHAQUE route
- Écris les tests unitaires des routes

PHASE C — Composables & logique métier
- use-household-members.ts (CRUD, partagé)
- use-todo-domains.ts (CRUD domaines)
- use-todo-contexts.ts (CRUD contextes, calcul progression)
- use-todo-tasks.ts (CRUD tâches, filtrage, changement de statut, gestion sous-tâches)
- use-todo-agenda.ts (groupement des tâches par jour pour la vue Agenda)
- Écris les tests unitaires

PHASE D — Interface utilisateur
- Page principale : /skills/todo-at-home.vue
- Composants dans app/components/skills/todo-at-home/ :
  - TodoDashboard.vue (grille de cartes contexte avec progression)
  - TodoContextCard.vue (carte individuelle d'un contexte)
  - TodoQuickAdd.vue (formulaire d'ajout rapide inline)
  - TodoContextAdd.vue (formulaire d'ajout de contexte inline)
  - TodoContextDetail.vue (vue détail d'un contexte avec ses tâches groupées par statut)
  - TodoTaskItem.vue (item tâche avec checkbox, infos, sous-tâches)
  - TodoTaskModal.vue (modale création/édition complète)
  - TodoFilters.vue (barre de filtres + modes couleur)
  - TodoAgendaView.vue (vue agenda groupée par jour)
  - TodoSettings.vue (gestion contextes + membres foyer)
- TOUT doit être responsive (mobile = usage principal pour certaines tâches)
- Lis agent_docs/ux_ui_guidelines.md pour les patterns visuels

PHASE E — Intégration, seed data & tests
- Enregistre le skill dans le registre (app/config/skills.ts)
- Crée le composant dashboard card (résumé : X tâches ouvertes, X urgentes)
- Implémente la seed data au premier lancement (domaine Maison + contextes par défaut + membre "Moi")
- Écris les tests e2e Playwright :
  - Créer un contexte → apparaît dans la grille
  - Ajout rapide → tâche dans le bon contexte
  - Changer statut → progression mise à jour
  - Filtrer → résultats corrects
  - Vue Agenda → groupement par jour
- Commit : "feat: add TodoAtHome skill with extensible domain/context model"
```

---

## Notes pour toi (développeur)

### Sur le style visuel
Le style de la vidéo (illustrations cartoon par pièce, pastels, dark mode avec dégradés violets) est très sympa. On ne le reproduit PAS dans cette phase — on reste sur le design system Percy (Tailwind + shadcn-vue sobre). Le "reskin" graphique fera l'objet d'un scope dédié plus tard. Le code doit juste prévoir les emplacements pour le style (couleur de contexte, slot pour illustration, etc.).

### Sur l'extensibilité
Le modèle Domain → Context → Task est prêt pour recevoir d'autres domaines. Quand on voudra ajouter "Vie scolaire" ou "Santé", il suffira de créer un nouveau domaine et ses contextes — pas de changement de schéma DB. Le seul changement sera éventuellement d'adapter l'UX (icônes spécifiques, champs additionnels via un système de "champs custom" — mais ça c'est pour plus tard).
