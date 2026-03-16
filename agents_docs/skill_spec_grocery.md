# Skill Spec — Grocery List (Liste de Courses)

## Résumé
Un outil rapide et fiable pour gérer ses courses : ajouter des produits quand on y pense (à la maison, en déplacement), puis pointer ses achats en magasin — même avec une connexion intermittente.

## Personas & Situations d'usage

### Situation 1 : "Je pense à un truc" (mode Ajout)
- Je suis chez moi, au bureau, dans le métro
- Je constate qu'il manque du lait, ou je pense à acheter quelque chose
- Je veux ouvrir Percy, taper "lait", valider → c'est sur la liste. En 3 secondes max.
- Si le produit existe déjà dans mes produits récurrents, il apparaît en autocomplétion.

### Situation 2 : "Je fais les courses" (mode Courses)
- Je suis en magasin, téléphone en main
- Je vois ma liste, organisée (optionnellement par catégorie)
- Je coche chaque produit au fur et à mesure
- La connexion peut être instable → l'app DOIT rester fonctionnelle offline
- Quand la connexion revient, les changements se synchronisent silencieusement

## Modèle de données

### Tables Prisma

```prisma
// Catégorie de produit (optionnel — "Sans catégorie" par défaut)
model GroceryCategory {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  name      String   // ex: "Fruits & Légumes", "Produits laitiers"
  sortOrder Int      @default(0)
  items     GroceryItem[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, name])
}

// Produit récurrent (le "catalogue" personnel)
model GroceryProduct {
  id         String    @id @default(cuid())
  userId     String
  user       User      @relation(fields: [userId], references: [id])
  name       String    // ex: "Lait demi-écrémé"
  categoryId String?
  category   GroceryCategory? @relation(fields: [categoryId], references: [id])
  usageCount Int       @default(1) // pour trier par fréquence dans l'autocomplétion
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt

  @@unique([userId, name])
}

// Item sur la liste de courses active
model GroceryItem {
  id         String    @id @default(cuid())
  userId     String
  user       User      @relation(fields: [userId], references: [id])
  name       String
  quantity   Int       @default(1)
  unit       String?   // ex: "kg", "L", "pièces" — optionnel
  categoryId String?
  category   GroceryCategory? @relation(fields: [categoryId], references: [id])
  checked    Boolean   @default(false)
  checkedAt  DateTime? // quand l'item a été coché (utile pour l'historique)
  sortOrder  Int       @default(0)
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
}
```

### Notes sur le modèle
- `GroceryProduct` = le catalogue personnel. Quand l'user tape "lai...", on cherche dans ses produits. Quand il ajoute un nouveau produit, il est ajouté au catalogue automatiquement.
- `GroceryItem` = un item sur la liste active. C'est ce qu'on coche en magasin.
- `GroceryCategory` = optionnel. Si aucune catégorie, les items s'affichent à plat.
- `usageCount` sur Product : incrémenté à chaque ajout à la liste, pour trier l'autocomplétion par fréquence (les produits les plus ajoutés apparaissent en premier).

## Écrans & UX

### Écran principal : `/skills/grocery`

```
┌──────────────────────────────────────┐
│  🛒 Liste de courses          [⚙️]  │
├──────────────────────────────────────┤
│  ┌──────────────────────────┐ [+]   │
│  │ Ajouter un produit...    │       │
│  └──────────────────────────┘       │
│  (autocomplétion au fur et à mesure)│
│                                      │
│  ── Fruits & Légumes (3) ─────────  │
│  ☐ Bananes × 6                      │
│  ☐ Tomates × 1 kg                   │
│  ☐ Citrons × 3                      │
│                                      │
│  ── Produits laitiers (2) ────────  │
│  ☐ Lait demi-écrémé × 2            │
│  ☐ Yaourts nature × 1              │
│                                      │
│  ── Sans catégorie (1) ───────────  │
│  ☐ Éponges × 1                      │
│                                      │
│  ─────────────────────────────────  │
│  ✅ Déjà acheté (2)         [Vider] │
│  ☑ Beurre × 1                       │
│  ☑ Pain de mie × 1                  │
└──────────────────────────────────────┘
```

### Comportements clés

**Champ d'ajout rapide :**
- Focus automatique quand on ouvre la page (sauf sur mobile — éviter le clavier intempestif)
- Autocomplétion depuis le catalogue personnel, triée par `usageCount` décroissant
- Si le produit n'existe pas dans le catalogue → on le crée automatiquement
- Sélection d'un produit existant : pré-remplit la catégorie
- Enter ou clic sur [+] → ajout immédiat à la liste
- Quantité : par défaut 1. L'user peut taper "Bananes x6" ou "Bananes × 6" et le parser extrait la quantité. Sinon on peut modifier la quantité après ajout.

**Liste d'items :**
- Groupés par catégorie si des catégories existent, sinon liste plate
- Chaque item : checkbox + nom + quantité (+ unité si définie)
- Swipe gauche (mobile) ou bouton au hover (desktop) → supprimer
- Clic sur l'item → édition inline (nom, quantité, catégorie)
- Items cochés → se déplacent dans la section "Déjà acheté" en bas, grisés

**Section "Déjà acheté" :**
- Collapsed par défaut (juste le compteur visible)
- Bouton "Vider" → supprime tous les items cochés de la liste (avec confirmation)
- Permet de "décocher" si erreur → retour dans la liste active

**Bouton ⚙️ (settings du skill) :**
- Gérer les catégories (CRUD simple)
- Gérer le catalogue de produits récurrents (voir, supprimer, changer catégorie)

## Résilience Offline

### Principe : Optimistic UI + Queue de synchronisation

L'idée : toutes les actions (ajouter, cocher, modifier, supprimer) s'appliquent IMMÉDIATEMENT sur l'état local. Les appels API sont mis en file d'attente et exécutés dès que possible. Si le réseau est indisponible, la queue attend et retry automatiquement.

### Implémentation technique

```typescript
// composables/use-offline-queue.ts — concept

interface QueuedAction {
  id: string              // ID unique pour dédupliquer
  type: 'create' | 'update' | 'delete'
  endpoint: string        // ex: '/api/skills/grocery/items'
  method: 'POST' | 'PATCH' | 'DELETE'
  body?: Record<string, unknown>
  timestamp: number
  retryCount: number
}
```

**Règles :**
1. Chaque action mutante génère un `QueuedAction` et met à jour l'état local immédiatement (optimistic update).
2. Le composable tente d'envoyer l'action au serveur.
3. Si succès → l'action sort de la queue, l'état local est mis à jour avec la réponse serveur (réconciliation des IDs par exemple).
4. Si échec réseau → l'action reste dans la queue. Un retry automatique se déclenche quand `navigator.onLine` repasse à `true` ou toutes les 10 secondes.
5. Si erreur serveur (4xx/5xx) → l'action est retirée de la queue et l'état local est rollback avec un toast d'erreur.
6. La queue est persistée dans `localStorage` pour survivre à un refresh de page.
7. Un indicateur discret (petit badge ou icône) signale quand des actions sont en attente de sync. Pas de popup intrusif.

**Ordre de la queue :** FIFO strict. Les actions sont rejouées dans l'ordre chronologique pour éviter les conflits (ex: créer un item PUIS le cocher).

**Déduplication :** Si l'utilisateur modifie le même item plusieurs fois offline, on ne garde que la dernière version (même `itemId` → remplace l'action précédente dans la queue, sauf pour delete qui prime toujours).

### Ce qu'on NE fait PAS (pour rester simple) :
- Pas de Service Worker / PWA complète pour le moment (trop complexe pour la v1)
- Pas de synchronisation temps réel entre appareils (un seul appareil à la fois suffit)
- Pas de résolution de conflits multi-appareils (last-write-wins est OK)
- La queue utilise localStorage, pas IndexedDB (suffisant pour cette taille de données)

## API Endpoints

```
GET    /api/skills/grocery/items          → Liste des items (actifs + cochés)
POST   /api/skills/grocery/items          → Ajouter un item
PATCH  /api/skills/grocery/items/:id      → Modifier un item (nom, quantité, checked...)
DELETE /api/skills/grocery/items/:id      → Supprimer un item
DELETE /api/skills/grocery/items/checked  → Supprimer tous les items cochés

GET    /api/skills/grocery/products       → Catalogue (pour autocomplétion)
DELETE /api/skills/grocery/products/:id   → Supprimer un produit du catalogue

GET    /api/skills/grocery/categories     → Liste des catégories
POST   /api/skills/grocery/categories     → Créer une catégorie
PATCH  /api/skills/grocery/categories/:id → Modifier une catégorie
DELETE /api/skills/grocery/categories/:id → Supprimer (items → "Sans catégorie")
```

## Dashboard Card (résumé)

Sur le dashboard Percy, le skill affiche une carte résumé :
```
┌─────────────────────────┐
│  🛒 Courses             │
│  7 articles à acheter   │
│  2 déjà pris            │
│                         │
│  Dernier ajout : Lait   │
└─────────────────────────┘
```

## Tests attendus

### Unit (Vitest)
- `use-grocery-list.ts` : CRUD des items, logique de cochage
- `use-offline-queue.ts` : ajout/retry/déduplication/rollback
- `use-grocery-autocomplete.ts` : filtrage, tri par fréquence
- API routes : validation Zod, auth check, ownership check

### E2E (Playwright)
- Ajouter un produit à la liste → il apparaît
- Cocher un produit → il passe dans "Déjà acheté"
- Vider les items cochés → confirmation puis suppression
- Autocomplétion : taper un produit existant → le sélectionner
