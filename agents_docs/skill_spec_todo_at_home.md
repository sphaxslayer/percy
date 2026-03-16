# Skill Spec — TodoAtHome (Tâches à la maison)

## Résumé
Un gestionnaire de tâches domestiques organisé par "contextes" (pièces de la maison, jardin, voiture, etc.). Chaque contexte est une carte visuelle avec ses tâches, sa progression, et ses assignations. Le modèle est conçu pour être extensible à d'autres domaines (vie scolaire, médical, etc.) via un système de "Contextes" génériques.

## Inspiration visuelle (issue de la vidéo de référence)
L'app ToDoHome montre les concepts clés suivants qu'on reprend et adapte :
- **Dashboard de pièces** : grille de cartes, chaque carte = un contexte (pièce) avec illustration, nom, compteur de tâches ouvertes, barre de progression
- **Code couleur par pièce** : chaque contexte a sa propre couleur (bordure, identité visuelle)
- **Ajout rapide** : formulaire inline "Créer un TODO rapide" (titre + choix du contexte)
- **Ajout de contexte** : formulaire "Ajouter une pièce" (nom + couleur)
- **Filtres** : recherche texte + filtres multiples (contexte, statut, priorité, assignation, tri)
- **Modes d'affichage couleur** : "Couleur par pièce", "Couleur par assigné", "Couleur par priorité"
- **Modale de création détaillée** : titre, description, pièce, statut (À faire / En cours / Fait), priorité (Basse / Normale / Haute), assignation (personne), échéance, couleur, sous-tâches
- **Vue Agenda** : une vue calendrier/agenda avec indicateurs de priorité (vert/jaune/rouge)
- **Dark mode** : toggle light/dark

## Modèle de données — Pensé extensible

### Concept clé : "Domaine" + "Contexte"

Pour que le même système de tâches puisse servir à la maison, à la vie scolaire, aux RDV médicaux, etc., on introduit une hiérarchie :

```
Domaine (Domain)          → "Maison", "Vie scolaire", "Santé", "Voiture"
  └── Contexte (Context)  → "Cuisine", "Salon", "Jardin" (pour Maison)
                           → "Mathématiques", "Français" (pour Vie scolaire)
                           → "Dentiste", "Pédiatre" (pour Santé)
        └── Tâche (Task)  → "Nettoyer le plan de travail"
              └── Sous-tâche (Subtask)
```

On ajoute aussi la notion de **Membre du foyer** (HouseholdMember) pour l'assignation : "Moi", "Conjoint(e)", "Enfant 1", etc. Ce concept est utilisable dans tous les domaines.

### Tables Prisma

```prisma
// ─── Membres du foyer (partagé entre tous les skills) ───

model HouseholdMember {
  id        String   @id @default(cuid())
  userId    String   // propriétaire du foyer
  user      User     @relation(fields: [userId], references: [id])
  name      String   // "Moi", "Sophie", "Lucas"
  avatar    String?  // emoji ou URL d'avatar
  role      String?  // "parent", "enfant", "autre"
  sortOrder Int      @default(0)
  tasks     TodoTask[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, name])
}

// ─── Domaines (groupes de contextes) ───

model TodoDomain {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  name        String   // "Maison", "Vie scolaire", "Santé"
  icon        String   @default("🏠") // emoji
  description String?
  sortOrder   Int      @default(0)
  contexts    TodoContext[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([userId, name])
}

// ─── Contextes (pièces, matières, spécialistes...) ───

model TodoContext {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  domainId    String
  domain      TodoDomain @relation(fields: [domainId], references: [id], onDelete: Cascade)
  name        String   // "Cuisine", "Salon", "Jardin", "Voiture"
  icon        String?  // emoji
  color       String   @default("#F59E0B") // hex color pour la carte
  imageUrl    String?  // illustration optionnelle (futur)
  sortOrder   Int      @default(0)
  isGlobal    Boolean  @default(false) // contexte "Overall/Global" du domaine
  tasks       TodoTask[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([userId, domainId, name])
}

// ─── Tâches ───

model TodoTask {
  id          String    @id @default(cuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  contextId   String
  context     TodoContext @relation(fields: [contextId], references: [id], onDelete: Cascade)
  title       String
  description String?
  status      String    @default("todo") // "todo", "in_progress", "done"
  priority    String    @default("normal") // "low", "normal", "high"
  color       String?   // couleur personnalisée optionnelle
  dueDate     DateTime? // échéance
  assigneeId  String?   // membre du foyer assigné
  assignee    HouseholdMember? @relation(fields: [assigneeId], references: [id], onDelete: SetNull)
  sortOrder   Int       @default(0)
  completedAt DateTime?
  subtasks    TodoSubtask[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

// ─── Sous-tâches ───

model TodoSubtask {
  id        String   @id @default(cuid())
  taskId    String
  task      TodoTask @relation(fields: [taskId], references: [id], onDelete: Cascade)
  title     String
  completed Boolean  @default(false)
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Notes sur le modèle
- **HouseholdMember** est séparé des skills et réutilisable (le skill Grocery pourra aussi l'utiliser pour "qui a ajouté quoi").
- **TodoDomain** est le conteneur de haut niveau. Pour la v1, on crée un seul domaine "Maison" par défaut. L'ajout de domaines sera simple quand on voudra ajouter vie scolaire ou santé.
- **TodoContext** correspond à une "pièce" dans ToDoHome, mais le nom est générique. Un contexte avec `isGlobal: true` est le contexte "Overall" du domaine (tâches qui ne sont rattachées à aucune pièce spécifique).
- **Statuts** : `todo` → `in_progress` → `done` (3 états comme dans la vidéo : "À faire", "En cours", "Fait").
- **Priorité** : 3 niveaux avec mapping couleur (vert/jaune/rouge comme dans la vue Agenda de la vidéo).

## Écrans & UX

### Écran principal : `/skills/todo-at-home`

#### Vue Dashboard (défaut)
```
┌──────────────────────────────────────────────────┐
│  📋 TodoAtHome                    [📅 Agenda] [⚙]│
├──────────────────────────────────────────────────┤
│                                                  │
│  ┌─ Ajouter un contexte ─┐  ┌─ TODO rapide ───┐ │
│  │ Nom: [          ]      │  │ Titre: [       ] │ │
│  │ Couleur: [🟡] [Ajouter]│  │ Contexte: [▼  ] │ │
│  └────────────────────────┘  │ [Créer]          │ │
│                              └──────────────────┘ │
│                                                   │
│  Rechercher: [          ] [Contexte▼] [Statut▼]   │
│  [Priorité▼] [Assigné▼] [Tri: Récent▼]           │
│                                                   │
│  [Couleur par contexte] [par assigné] [par prio]  │
│                                                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│  │ 🏠 Overall  │ │ 🍳 Cuisine  │ │ 🛋 Salon    │ │
│  │ 2 tâches    │ │ 1 tâche     │ │ 3 tâches    │ │
│  │ ████░░ 50%  │ │ ██░░░░ 0%   │ │ █████░ 66%  │ │
│  │             │ │             │ │             │ │
│  │ • Lancer    │ │ • Nettoyer  │ │ • Aspirer   │ │
│  │   machine   │ │   plan de   │ │   À faire   │ │
│  │   Moi/Àfaire│ │   travail   │ │   Libre     │ │
│  └─────────────┘ │  Sophie/Enc.│ └─────────────┘ │
│                  └─────────────┘                  │
│  ┌─────────────┐ ┌─────────────┐                  │
│  │ 🚿 Salle    │ │ 🛏 Chambre  │                  │
│  │ de bain     │ │ 0 tâches    │                  │
│  │ 0 tâches    │ │ Aucune tâche│                  │
│  └─────────────┘ └─────────────┘                  │
└──────────────────────────────────────────────────┘
```

#### Vue détail d'un contexte (clic sur une carte)
```
┌──────────────────────────────────────────────────┐
│  ← Retour    🍳 Cuisine                   [⚙]   │
├──────────────────────────────────────────────────┤
│  [+ Ajouter une tâche]                           │
│                                                   │
│  ── À faire (2) ────────────────────────────      │
│  ☐ Nettoyer le plan de travail                    │
│     Sophie · Normale · pas d'échéance             │
│  ☐ Changer le filtre de la hotte                  │
│     Libre · Basse · échéance 20/04               │
│                                                   │
│  ── En cours (1) ───────────────────────────      │
│  🔄 Ranger les placards du haut                   │
│     Moi · Haute · échéance 18/03                 │
│     └─ ☐ Placard gauche                          │
│     └─ ☑ Placard droit                           │
│                                                   │
│  ── Fait (3) ───────────────────── [Archiver]     │
│  ☑ Détartrer la cafetière                        │
│  ☑ Acheter des éponges                           │
│  ☑ Réparer poignée du tiroir                     │
└──────────────────────────────────────────────────┘
```

#### Modale de création/édition de tâche
```
┌────────────────────────────────────────────┐
│  Nouvelle tâche                    [Fermer]│
├────────────────────────────────────────────┤
│  Titre: [                              ]   │
│  Description: [                        ]   │
│                                            │
│  Contexte: [Cuisine ▼]                     │
│  Statut: [À faire ▼]                      │
│  Priorité: [Normale ▼]                    │
│  Assignée à: [Personne ▼]                 │
│  Échéance: [jj/mm/aaaa --:--]             │
│  Couleur: [🟡]                             │
│                                            │
│  Sous-tâches (une ligne = une tâche) :     │
│  [                                     ]   │
│  [                                     ]   │
│  [+ Ajouter une sous-tâche]               │
│                                            │
│  [Créer]                                   │
└────────────────────────────────────────────┘
```

#### Vue Agenda (toggle en haut)
Vue calendrier montrant les tâches avec échéance, avec indicateurs de priorité :
- 🟢 Basse = pastille verte
- 🟡 Normale = pastille jaune  
- 🔴 Haute = pastille rouge

Pour la v1, une liste chronologique groupée par jour suffit (pas de calendrier complet). On pourra enrichir avec un vrai calendrier ou un branchement Google Calendar plus tard.

```
┌──────────────────────────────────────────────────┐
│  📅 Agenda                       [📋 Dashboard]  │
├──────────────────────────────────────────────────┤
│                                                   │
│  ── Aujourd'hui (lun. 16 mars) ─────────────      │
│  🔴 Ranger les placards · Cuisine · Moi          │
│                                                   │
│  ── Demain (mar. 17 mars) ──────────────────      │
│  (rien)                                           │
│                                                   │
│  ── Jeudi 20 mars ──────────────────────────      │
│  🟢 Changer filtre hotte · Cuisine · Libre       │
│  🟡 Tondre la pelouse · Jardin · Moi             │
│                                                   │
│  ── Sans échéance ──────────────────────────      │
│  🟡 Nettoyer plan de travail · Cuisine · Sophie  │
│  🟡 Aspirer · Salon · Libre                      │
└──────────────────────────────────────────────────┘
```

### Comportements clés

**Ajout rapide (champ inline)** :
- Titre + sélection du contexte dans un dropdown → Créer
- Créé avec statut "À faire", priorité "Normale", non assigné
- Ouvre optionnellement la modale complète si l'user veut détailler

**Cartes contexte (dashboard)** :
- Affichent : nom, icône/couleur, nombre de tâches ouvertes, barre de progression (% fait)
- Aperçu des 1-2 premières tâches en preview (titre + assigné + statut)
- Clic → vue détail du contexte
- Le contexte "Global/Overall" a un badge spécial

**Filtres** :
- Recherche texte libre (titre de tâche)
- Dropdown par : contexte, statut, priorité, assigné
- Tri : récent, échéance, priorité
- Les filtres s'appliquent sur la vue dashboard (filtrent les cartes et leur contenu)

**Modes couleur** :
- "Couleur par contexte" : chaque carte utilise la couleur du contexte (défaut)
- "Couleur par assigné" : couleur attribuée au membre du foyer
- "Couleur par priorité" : vert/jaune/rouge

**Gestion des contextes** :
- Ajout inline (nom + couleur)
- Édition/suppression via ⚙ (settings)
- Un contexte supprimé → ses tâches passent au contexte "Global"
- Drag & drop pour réordonner (nice-to-have, pas v1)

**Gestion des membres du foyer** :
- Accessible via ⚙ (settings du skill) ou settings globaux Percy
- CRUD simple : nom, avatar (emoji), rôle
- Un membre "Libre" / non assigné est toujours disponible

## API Endpoints

```
# Domaines
GET    /api/skills/todo-at-home/domains              → Liste des domaines
POST   /api/skills/todo-at-home/domains              → Créer un domaine
PATCH  /api/skills/todo-at-home/domains/:id          → Modifier
DELETE /api/skills/todo-at-home/domains/:id           → Supprimer

# Contextes
GET    /api/skills/todo-at-home/contexts              → Tous (filtrable par domainId)
POST   /api/skills/todo-at-home/contexts              → Créer
PATCH  /api/skills/todo-at-home/contexts/:id          → Modifier
DELETE /api/skills/todo-at-home/contexts/:id           → Supprimer (tâches → Global)

# Tâches
GET    /api/skills/todo-at-home/tasks                 → Toutes (filtrable)
POST   /api/skills/todo-at-home/tasks                 → Créer
PATCH  /api/skills/todo-at-home/tasks/:id             → Modifier (statut, assignation, etc.)
DELETE /api/skills/todo-at-home/tasks/:id              → Supprimer

# Sous-tâches
POST   /api/skills/todo-at-home/tasks/:taskId/subtasks        → Créer
PATCH  /api/skills/todo-at-home/tasks/:taskId/subtasks/:id    → Modifier
DELETE /api/skills/todo-at-home/tasks/:taskId/subtasks/:id    → Supprimer

# Membres du foyer (partagé — pas sous /skills/todo-at-home)
GET    /api/household/members                         → Liste
POST   /api/household/members                         → Créer
PATCH  /api/household/members/:id                     → Modifier
DELETE /api/household/members/:id                      → Supprimer
```

### Filtres sur GET /tasks
```
?contextId=xxx           → par contexte
?domainId=xxx            → par domaine
?status=todo,in_progress → par statut(s)
?priority=high           → par priorité
?assigneeId=xxx          → par assigné
?search=aspirateur       → recherche texte
?sort=dueDate            → tri (dueDate, createdAt, priority)
?order=asc               → ordre
?withDueDate=true        → seulement les tâches avec échéance (pour Agenda)
```

## Dashboard Card (résumé Percy)

```
┌─────────────────────────┐
│  📋 TodoAtHome          │
│  12 tâches ouvertes     │
│  5 faites cette semaine │
│                         │
│  🔴 2 urgentes          │
│  Prochain: Ranger       │
│  placards (aujourd'hui) │
└─────────────────────────┘
```

## Seed data (premier lancement)

Quand l'utilisateur active le skill pour la première fois, créer automatiquement :
- 1 domaine "Maison" avec icône 🏠
- 1 contexte "Global" (isGlobal: true) dans ce domaine
- Quelques contextes suggérés (l'user peut les supprimer) : Cuisine, Salon, Chambre, Salle de bain, Bureau
- 1 membre du foyer "Moi" (si aucun membre n'existe)

## Tests attendus

### Unit (Vitest)
- `use-todo-tasks.ts` : CRUD tâches, changement de statut, filtrage, tri
- `use-todo-contexts.ts` : CRUD contextes, suppression avec migration des tâches
- `use-todo-agenda.ts` : groupement par jour, tri par échéance
- `use-household-members.ts` : CRUD membres
- API routes : validation Zod, auth, ownership, filtres, cascade delete

### E2E (Playwright)
- Créer un contexte → il apparaît dans la grille
- Ajout rapide d'une tâche → elle apparaît dans le bon contexte
- Changer le statut d'une tâche (todo → done) → progression mise à jour
- Filtrer par priorité → seules les tâches concernées s'affichent
- Vue Agenda → les tâches avec échéance sont groupées par jour

## Extensibilité future (pas dans le scope v1, mais le modèle le supporte)

### Domaine "Vie scolaire"
- Contextes : "Mathématiques", "Français", "Histoire", ...
- Tâches : devoirs, contrôles, projets
- Assignation : un enfant spécifique

### Domaine "Santé / RDV médicaux"
- Contextes : "Généraliste", "Dentiste", "Pédiatre", "Ophtalmo"
- Tâches : prendre RDV, rappel vaccin, renouveler ordonnance
- Assignation : chaque membre du foyer

### Domaine "Voiture(s)"
- Contextes : "Clio", "Vélo cargo"
- Tâches : contrôle technique, vidange, pneus hiver

Le modèle Domain → Context → Task → Subtask + HouseholdMember supporte tout ça nativement sans changement de schéma.
