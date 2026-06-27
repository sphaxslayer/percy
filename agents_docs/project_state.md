# Project State — Percy

> **Purpose**: snapshot of where the project stands today. Read this first at the start of any session to understand what's done, what's in progress, and what's next. Keep it updated when meaningful work lands.

---

## Last update
- **Date**: 2026-06-27
- **Branch**: `main` (in sync with `origin/main`)
- **Working tree**: clean

## Skills shipped

### 1. Grocery List (`/skills/grocery-list`)
Status: **stable**.

- Personal product catalog with usage-frequency autocomplete.
- Input parser for quantities (`Bananes x6`, `Lait 2L`).
- Categories (CRUD, drag-drop reorder, grouped or flat display).
- Optimistic UI with localStorage-backed offline queue (`use-offline-queue`).
- Drag-drop reorder persisted to DB (`items-reorder.patch`).

Files: `app/pages/skills/grocery-list.vue`, `app/components/skills/grocery/*`, `app/composables/use-grocery-*.ts`, `server/api/skills/grocery/*`.

### 2. TodoAtHome (`/skills/todo-at-home`)
Status: **MVP shipped**.

- Domain → Context → Task → Subtask hierarchy.
- Context cards with illustration picker (`/api/skills/todo-at-home/illustrations.get`).
- Drag-drop reorder for both contexts and tasks; sort order persisted.
- Client-side filtering and search (filter chips, name + title match).
- Agenda view, dashboard summary, quick-add modal, task modal with subtasks.
- Optional assignment to `HouseholdMember`.

Files: `app/pages/skills/todo-at-home.vue`, `app/components/skills/todo-at-home/*`, `app/composables/use-todo-*.ts`, `server/api/skills/todo-at-home/*`.

## Cross-cutting building blocks

- **Auth**: NextAuth (credentials provider) + register/login/settings pages.
- **Design system**: Percy tokens (`percy-*`) with dual themes + dark mode. **Strict rule**: no hardcoded Tailwind color classes anywhere in `.vue` files. See `agents_docs/design_system.md`.
- **HouseholdMember**: shared model under `/api/household/members/*`, used by TodoAtHome (task assignment). Available for future skills.
- **Skill registry**: `app/config/skills.ts` — central list driving sidebar, dashboard grid, and routing.
- **Testing**: Vitest (`tests/unit`) + Playwright (`tests/e2e`). CI runs lint + type-check + unit + e2e on every PR.

## Known issues / debt

- None blocking. Only `TodoQuickAdd.vue:44` has a literal "TODO rapide" label (UI text — not a code TODO).
- Several stale local + remote branches (already absorbed into `main` via squash) — candidates for deletion.

## Backlog ideas (not started)

These are unbuilt skills/features that came up in product discussions — pick freely:

- **AI chat skill** (LLM-backed assistant integrated with the dashboard).
- **Calendar / agenda aggregator** across household members.
- **Meal planner** linked to Grocery List (auto-generate shopping items from selected recipes).
- **Budget / expenses tracker**.
- **Birthday & event reminders**.
- **Document vault** (insurance, school, contracts).
- **PWA install + push notifications** for reminders.

## Workflow reminders for the next session

1. Read this file first.
2. Read `AGENTS.md` (root) for coding rules — semicolons, kebab-case, Composition API everywhere, no Options API in stores, strict Percy color tokens.
3. Read the relevant `agents_docs/<domain>.md` before starting work in that domain.
4. Create a feature branch (`feature/`, `fix/`, `chore/`). Never commit to `main` directly.
5. Run `pnpm lint && pnpm test:unit` before committing. `pnpm test:e2e` for UI-impacting work.
6. **Commit author rule**: never include `Co-Authored-By` trailers referencing AI tools — see `AGENTS.md`.

## How to add a new skill (quick checklist)

1. `prisma/schema.prisma` — add models, prefix with the skill name, link to `User`. Run `pnpm db:migrate`.
2. `server/api/skills/<skill>/` — REST routes (Zod-validated, Prisma-backed).
3. `app/types/<skill>.ts` — shared types.
4. `app/composables/use-<skill>-*.ts` — CRUD composables, optimistic UI.
5. `app/components/skills/<skill>/*.vue` — UI primitives.
6. `app/pages/skills/<skill>.vue` — page (server-side auth-gated).
7. `app/config/skills.ts` — register the skill (icon, name, route, dashboard preview component).
8. Unit tests for composables (Vitest) + at least one e2e happy path (Playwright).

Full reference: `agents_docs/architecture.md`.
