# Prompt d'amorçage — Claude Code

## Comment utiliser ce fichier

Copie-colle le contenu de la section "PROMPT" ci-dessous dans Claude Code comme premier message
APRÈS avoir mis en place la structure du projet (instructions dans la section "AVANT LE PROMPT").

---

## AVANT LE PROMPT — Mise en place

### 1. Créer le répertoire du projet
```bash
mkdir percy && cd percy
git init
```

### 2. Copier les fichiers de configuration
Copie les fichiers suivants (générés dans ce package) dans ton projet :
```
percy/
├── CLAUDE.md                          # ← depuis ce package
└── agent_docs/                        # ← depuis ce package (tout le dossier)
    ├── architecture.md
    ├── frontend_conventions.md
    ├── backend_conventions.md
    ├── qa_guidelines.md
    ├── devops_setup.md
    ├── product_spec.md
    └── ux_ui_guidelines.md
```

### 3. Lancer Claude Code
```bash
claude
```

### 4. Coller le prompt ci-dessous

---

## PROMPT

```
Je lance un nouveau projet : "Percy", un assistant personnel sous forme d'application web.

Tu as accès au fichier CLAUDE.md à la racine du projet et au dossier agent_docs/ qui contient des documents de référence détaillés pour chaque domaine (architecture, frontend, backend, QA, DevOps, UX/UI, product spec).

RÈGLE FONDAMENTALE : Avant de travailler sur un domaine, lis TOUJOURS le document agent_docs/ correspondant. Ces documents sont ta source de vérité pour les conventions, patterns et décisions architecturales du projet.

---

CONTEXTE TECHNIQUE :
- Stack : Nuxt 3 (Vue 3 Composition API) + Nitro server routes + PostgreSQL (Prisma) + Tailwind + shadcn-vue
- Auth : sidebase/nuxt-auth (JWT, credentials provider, multi-user)
- Tests : Vitest (unit) + Playwright (e2e)
- Package manager : pnpm
- TypeScript strict partout

CONTEXTE UTILISATEUR :
- Je suis un développeur professionnel mais pas expert Vue3/Nuxt/Node.js
- Quand tu fais des choix non évidents, explique-les en commentaire dans le code
- Préfère le code explicite et lisible aux abstractions obscures

---

PHASE 1 — BOOTSTRAPPER LE PROJET

Procède étape par étape, en mode plan d'abord (Shift+Tab×2 si disponible) :

1. Initialise le projet Nuxt 3 avec pnpm :
   - nuxt.config.ts configuré avec les modules nécessaires
   - TypeScript strict
   - Tailwind CSS
   - shadcn-vue (installe les composants de base : Button, Input, Card, Dialog, Toast, Skeleton, Badge, DropdownMenu)

2. Configure Prisma :
   - Schema initial avec le modèle User (id, email, passwordHash, name, createdAt, updatedAt)
   - Client Prisma dans server/utils/prisma.ts (pattern singleton pour le dev)
   - docker-compose.yml pour PostgreSQL local

3. Configure l'authentification :
   - sidebase/nuxt-auth avec credentials provider
   - Route register (POST /api/auth/register) avec hachage bcrypt
   - Middleware Nuxt pour protéger les routes /dashboard et /skills/*
   - Pages : login.vue, register.vue

4. Crée le layout principal (layouts/default.vue) :
   - Sidebar collapsible avec navigation des skills (dynamique depuis le skill registry)
   - Header avec nom de l'app + menu utilisateur (dropdown avec logout)
   - Zone de contenu principal (<slot />)
   - Responsive : sidebar → hamburger menu sur mobile

5. Crée la page dashboard (pages/dashboard.vue) :
   - Grille de SkillCards alimentée par le skill registry (app/config/skills.ts)
   - Chaque carte : icône, nom, description courte, lien vers la page du skill
   - État vide : message d'accueil si aucun skill activé

6. Crée le skill registry (app/config/skills.ts) :
   - Interface SkillDefinition (voir agent_docs/product_spec.md)
   - Liste initiale vide (on ajoutera le premier skill ensuite)

7. Configure ESLint + Prettier :
   - Config adaptée à Vue 3 + TypeScript
   - Script pnpm lint

8. Configure les tests :
   - Vitest pour les tests unitaires
   - Playwright pour les tests e2e
   - Au moins un test : vérifier que la page login se charge

9. Crée le .env.example et le .gitignore appropriés

10. Fais un commit initial : "feat: bootstrap Percy project with auth, layout and dashboard"

---

IMPORTANT :
- Travaille branche par branche (commence par une branche feature/bootstrap)
- Respecte les conventions de CLAUDE.md et des agent_docs/
- Si tu as un doute sur un choix, explique les options et demande-moi
- Chaque fichier créé doit avoir un commentaire en haut expliquant son rôle
```

---

## APRÈS LE BOOTSTRAP — Première feature : Liste de courses

Une fois le bootstrap terminé et validé, lance une nouvelle session Claude Code (contexte propre) et colle ce prompt :

```
Lis ces fichiers dans l'ordre :
1. agent_docs/architecture.md
2. agent_docs/skill_spec_grocery.md
3. agent_docs/frontend_conventions.md
4. agent_docs/backend_conventions.md

Implémente le skill "Grocery List" (Liste de courses) tel que spécifié dans skill_spec_grocery.md.

Suis la checklist "Adding a New Skill" de architecture.md.
Crée une branche feature/grocery-list.

Procède en 4 phases séquentielles, en validant chaque phase avec moi avant de passer à la suivante :

PHASE A — Base de données & API
- Ajoute les modèles Prisma (GroceryCategory, GroceryProduct, GroceryItem)
- Crée la migration
- Implémente tous les endpoints API dans server/api/skills/grocery/
- Valide les inputs avec Zod, vérifie l'auth, scope par userId
- Écris les tests unitaires des routes API

PHASE B — Composables & logique métier
- use-grocery-list.ts : CRUD items, logique de cochage, groupement par catégorie
- use-grocery-autocomplete.ts : recherche dans le catalogue, tri par fréquence
- use-offline-queue.ts : queue d'actions avec retry, déduplication, persistance localStorage
- Écris les tests unitaires des composables

PHASE C — Interface utilisateur
- Page /skills/grocery.vue
- Composants : champ d'ajout rapide avec autocomplétion, liste d'items groupée, section "déjà acheté", écran settings (catégories + catalogue)
- Responsive mobile-first pour ce skill (usage principal = en magasin sur téléphone)
- Indicateur discret de synchronisation quand des actions sont en queue
- Lis agent_docs/ux_ui_guidelines.md pour les patterns visuels

PHASE D — Intégration dashboard & tests e2e
- Enregistre le skill dans le registre (app/config/skills.ts)
- Crée le composant dashboard card (résumé : X articles à acheter)
- Écris les tests e2e Playwright (ajout, cochage, vider, autocomplétion)
- Commit final : "feat: add grocery list skill with offline support"
```

---

## Pour les features suivantes

Le même pattern s'applique. Crée un fichier `agent_docs/skill_spec_<nom>.md` avec la spec détaillée, puis lance Claude Code avec :

```
Lis agent_docs/architecture.md et agent_docs/skill_spec_<nom>.md.
Suis la checklist "Adding a New Skill".
Crée une branche feature/<nom>.
Implémente en phases (API → Composables → UI → Dashboard + Tests).
```

---

## Notes importantes

### Sur les agents multiples
Le CLAUDE.md et les agent_docs/ remplacent le besoin d'agents parallèles en phase de démarrage. Claude Code lit le document pertinent selon le contexte et adopte le "rôle" correspondant (architecte, frontend dev, backend dev, QA, etc.).

Quand le projet sera plus mature et que tu voudras paralléliser (ex: frontend + backend en même temps), tu pourras utiliser les subagents de Claude Code ou la fonctionnalité Agent Teams (expérimentale).

### Sur le vibe coding
Le CLAUDE.md et les conventions documentées garantissent que même en mode "vibe coding" rapide, le code reste cohérent et maintenable. C'est l'investissement le plus rentable : 30 minutes de documentation initiale pour des heures de cohérence ensuite.
