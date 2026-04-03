# Percy — Personal Assistant Application

## Project Overview
Percy is a modular personal assistant web application. It provides the user with a dashboard of "skills" (features/automations) that save time in daily life. The app is designed to evolve incrementally: each skill is an independent module added over time.

## Tech Stack
- **Frontend**: Vue 3 (Composition API + `<script setup>`) + Nuxt 3
- **UI Framework**: Tailwind CSS + shadcn-vue (components)
- **Backend**: Nuxt server routes (Nitro engine) — unified fullstack
- **Database**: PostgreSQL via Prisma ORM
- **Authentication**: Nuxt Auth (next-auth port) — email/password + OAuth-ready
- **State Management**: Pinia
- **Testing**: Vitest (unit) + Playwright (e2e)
- **Language**: TypeScript everywhere (strict mode)

## Architecture

```
percy/
├── CLAUDE.md                  # This file — project-level instructions
├── agent_docs/                # Progressive disclosure docs for Claude
│   ├── architecture.md        # System architecture & conventions
│   ├── frontend_conventions.md
│   ├── backend_conventions.md
│   ├── qa_guidelines.md
│   ├── devops_setup.md
│   └── product_spec.md
├── nuxt.config.ts
├── prisma/
│   └── schema.prisma
├── server/
│   ├── api/                   # API routes (Nitro)
│   ├── middleware/             # Server middleware (auth, logging)
│   └── utils/                 # Server-side utilities
├── app/
│   ├── components/
│   │   ├── ui/                # Shared UI components (shadcn-vue)
│   │   ├── layout/            # Shell, sidebar, header
│   │   └── skills/            # Skill-specific components
│   ├── composables/           # Vue composables (shared logic)
│   ├── layouts/               # Nuxt layouts (default, auth, dashboard)
│   ├── pages/                 # File-based routing
│   │   ├── index.vue          # Landing / login redirect
│   │   ├── dashboard.vue      # Main dashboard
│   │   └── skills/            # One page per skill
│   ├── stores/                # Pinia stores
│   └── assets/                # Styles, images
├── tests/
│   ├── unit/
│   └── e2e/
├── .github/
│   └── workflows/             # CI/CD pipelines
├── Dockerfile
└── docker-compose.yml
```

## Coding Rules

### General
- TypeScript strict mode everywhere. No `any` unless explicitly justified with a comment.
- Always end JS/TS statements with a semicolon, even when not mandatory.
- Use ESLint + Prettier. Run `pnpm lint` before committing.
- All files use kebab-case naming: `my-component.vue`, `user-service.ts`.
- Prefer small, focused files. Max ~200 lines per file. If bigger, split.

### Frontend (Vue 3 / Nuxt)
- ALWAYS use `<script setup lang="ts">` syntax (Composition API).
- NEVER use Options API — not in components, not in Pinia stores, nowhere.
- Pinia stores: ALWAYS use the setup/Composition API syntax (`defineStore('id', () => { ... })`), NEVER the Options API syntax (`defineStore('id', { state, actions, getters })`).
- Components: PascalCase in templates (`<MyComponent />`), kebab-case file names.
- Props: define with `defineProps<{ ... }>()` (type-only syntax).
- Emits: define with `defineEmits<{ ... }>()`.
- Use composables (`use*.ts`) for reusable logic, not mixins.
- **Design system — STRICT RULE**: NEVER use hardcoded Tailwind color classes (`slate-`, `gray-`, `blue-`, `red-`, `green-`, etc.) anywhere in `.vue` files. ALWAYS use `percy-*` tokens (`text-percy-danger`, `bg-percy-primary`, `border-percy-border`, etc.). The full token list is in `app/assets/css/themes.css`. This applies to every color in every context — including error messages, badges, buttons, borders, backgrounds — with no exceptions.
- Read `@agent_docs/frontend_conventions.md` before any frontend work.
- Read `@agent_docs/design_system.md` before writing any component styles.

### Backend (Nitro server routes)
- API routes in `server/api/` follow REST conventions.
- Route files: `server/api/skills/[id].get.ts`, `server/api/skills/index.post.ts`.
- Always validate input with Zod schemas.
- Use Prisma for all DB access. Never write raw SQL unless justified.
- Read `@agent_docs/backend_conventions.md` before any backend work.

### Testing
- Every new feature must include unit tests (Vitest) at minimum.
- Critical user flows require e2e tests (Playwright).
- Run `pnpm test` before any commit.
- Read `@agent_docs/qa_guidelines.md` before writing tests.

### Git Workflow
- Branch naming: `feature/<skill-name>`, `fix/<description>`, `chore/<description>`.
- Commits: Conventional Commits format (`feat:`, `fix:`, `chore:`, `test:`, `docs:`).
- Always create a feature branch. Never commit directly to `main`.
- Each PR must pass CI (lint + type-check + tests) before merge.

## Skills Architecture
Each skill is a self-contained module:
```
app/pages/skills/<skill-name>.vue      # Page
app/components/skills/<skill-name>/    # Skill-specific components
app/composables/use-<skill-name>.ts    # Skill logic
server/api/skills/<skill-name>/        # API endpoints
prisma/migrations/                     # DB migrations if needed
```

To add a new skill, read `@agent_docs/architecture.md` for the full checklist.

## Commands
```bash
pnpm dev          # Start dev server (http://localhost:3000)
pnpm build        # Production build
pnpm test         # Run all tests
pnpm test:unit    # Vitest only
pnpm test:e2e     # Playwright only
pnpm lint         # ESLint + type-check
pnpm db:push      # Push Prisma schema to DB
pnpm db:migrate   # Create and apply migration
pnpm db:studio    # Open Prisma Studio (DB GUI)
```

## Important Notes
- ALWAYS read the relevant `agent_docs/*.md` file before starting work in a domain.
- When in doubt about architecture decisions, refer to `agent_docs/architecture.md`.
- The user is learning Vue 3/Nuxt/Node.js — explain non-obvious patterns in comments.
- Prefer explicit code over clever abstractions. Readability > brevity.
