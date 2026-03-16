# Percy — Personal Assistant

Percy is a modular personal assistant web application. It provides a dashboard of "skills" (features/automations) that save time in daily life. Each skill is an independent, self-contained module added incrementally.

## Table of Contents

- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Setup](#setup)
  - [Available Commands](#available-commands)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
  - [Frontend](#frontend)
  - [Backend](#backend)
  - [Authentication](#authentication)
  - [Testing](#testing)
  - [Code Quality](#code-quality)
  - [DevOps](#devops)
  - [Key Libraries (supporting)](#key-libraries-supporting)

## Getting Started

### Prerequisites

- Node.js 20+ (LTS recommended)
- pnpm (`npm install -g pnpm`)
- Docker (for local PostgreSQL)

### Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Set up environment
cp .env.example .env
# Edit .env — generate a secret: openssl rand -base64 32

# 3. Start PostgreSQL
docker compose up -d db

# 4. Push database schema
pnpm db:push

# 5. Start dev server
pnpm dev
# → http://localhost:3000
```

### Available Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server (http://localhost:3000) |
| `pnpm build` | Production build |
| `pnpm lint` | ESLint + type-check |
| `pnpm format` | Prettier format all files |
| `pnpm test` | Run all tests (unit + e2e) |
| `pnpm test:unit` | Vitest only |
| `pnpm test:e2e` | Playwright only |
| `pnpm db:push` | Push Prisma schema to DB |
| `pnpm db:migrate` | Create and apply migration |
| `pnpm db:studio` | Open Prisma Studio (DB GUI) |

## Tech Stack

### Frontend

| Tool | Role | Why |
|------|------|-----|
| [**Nuxt 3**](https://nuxt.com) | Fullstack Vue framework | File-based routing, SSR/SSG, server routes (Nitro), auto-imports. Single codebase for frontend + backend. |
| [**Vue 3**](https://vuejs.org) (Composition API) | UI framework | `<script setup>` syntax everywhere. Reactive, component-based UI with TypeScript support. |
| [**Tailwind CSS**](https://tailwindcss.com) | Utility-first CSS | Rapid styling via class utilities. No custom CSS unless absolutely needed. Integrated via `@nuxtjs/tailwindcss`. |
| [**shadcn-vue**](https://www.shadcn-vue.com) | UI component library | Accessible, unstyled primitives (Button, Card, Dialog, DropdownMenu, etc.) built on [Reka UI](https://reka-ui.com) (Radix Vue successor). Components live in `app/components/ui/` — they're source code, not a dependency. |
| [**Lucide Vue**](https://lucide.dev) | Icon library | Tree-shakable SVG icons used across the UI and skill cards. |
| [**Pinia**](https://pinia.vuejs.org) | State management | Lightweight, type-safe stores. Integrated via `@pinia/nuxt`. |

### Backend

| Tool | Role | Why |
|------|------|-----|
| [**Nitro**](https://nitro.unjs.io) (built into Nuxt) | Server engine | API routes in `server/api/`, middleware in `server/middleware/`. No separate Express/Fastify server needed. |
| [**Prisma**](https://www.prisma.io) (v6) | ORM / database toolkit | Type-safe database access, schema-driven migrations, auto-generated client. Schema in `prisma/schema.prisma`. |
| [**PostgreSQL**](https://www.postgresql.org) (v16) | Database | Relational database. Runs locally via Docker (`docker-compose.yml`). |
| [**Zod**](https://zod.dev) (v4) | Input validation | Schema-based validation for all API route inputs. Used in every `server/api/` handler. |
| [**bcrypt**](https://github.com/kelektiv/node.bcrypt.js) | Password hashing | Industry-standard password hashing (12 salt rounds) for the credentials auth provider. |

### Authentication

| Tool | Role | Why |
|------|------|-----|
| [**sidebase/nuxt-auth**](https://sidebase.io/nuxt-auth) | Auth module | NextAuth.js port for Nuxt 3. Handles session management, CSRF, JWT tokens in httpOnly cookies. |
| **Credentials provider** | Login method | Email + password authentication. OAuth providers (Google, GitHub) can be added later via config. |
| **JWT strategy** | Session storage | Stateless tokens stored in httpOnly cookies — no server-side session store needed. |

### Testing

| Tool | Role | Why |
|------|------|-----|
| [**Vitest**](https://vitest.dev) | Unit tests | Fast, native ESM, Vue Test Utils compatible. Config in `vitest.config.ts`, tests in `tests/unit/`. |
| [**Playwright**](https://playwright.dev) | E2E tests | Cross-browser testing for critical user flows. Config in `playwright.config.ts`, tests in `tests/e2e/`. |
| [**@nuxt/test-utils**](https://nuxt.com/docs/getting-started/testing) | Test helpers | Nuxt-aware test environment for composables, auto-imports, and server routes. |

### Code Quality

| Tool | Role | Why |
|------|------|-----|
| [**TypeScript**](https://www.typescriptlang.org) (strict mode) | Type safety | Strict mode everywhere. No `any` without justification. |
| [**ESLint**](https://eslint.org) + [@nuxt/eslint](https://eslint.nuxt.com) | Linting | Nuxt-aware rules for Vue 3 + TypeScript. Flat config in `eslint.config.mjs`. |
| [**Prettier**](https://prettier.io) | Formatting | Consistent code style. Config in `.prettierrc`. |

### DevOps

| Tool | Role | Why |
|------|------|-----|
| [**Docker**](https://www.docker.com) | Containerization | Multi-stage `Dockerfile` for production. `docker-compose.yml` for local PostgreSQL. |
| [**GitHub Actions**](https://github.com/features/actions) | CI/CD | Lint + type-check + unit tests on every PR. E2E tests on merge to main. Config in `.github/workflows/ci.yml`. |
| **pnpm** | Package manager | Fast, disk-efficient. Strict dependency resolution. |

### Key Libraries (supporting)

| Library | Purpose |
|---------|---------|
| `class-variance-authority` (CVA) | Variant management for shadcn-vue components (e.g., Button variants/sizes) |
| `clsx` + `tailwind-merge` | Smart Tailwind class merging — resolves conflicts like `p-2 p-4` → `p-4` |
| `reka-ui` | Headless UI primitives (successor to Radix Vue) — used by shadcn-vue components |
| `vue-sonner` | Toast notification system |
| `@vueuse/core` | Vue composition utilities (used by some shadcn components) |

## Project Structure

```
percy/
├── app/                          # Frontend (Vue 3 / Nuxt)
│   ├── components/
│   │   ├── layout/               # Shell: sidebar, header, mobile nav
│   │   ├── skills/               # Skill-specific components
│   │   └── ui/                   # shadcn-vue primitives (source code)
│   ├── composables/              # Reusable Vue logic (use*.ts)
│   ├── config/skills.ts          # Skill registry
│   ├── layouts/                  # default (dashboard) + auth (centered card)
│   ├── lib/utils.ts              # cn() class merge utility
│   ├── middleware/               # Client-side route guards
│   ├── pages/                    # File-based routing
│   └── stores/                   # Pinia stores
├── server/                       # Backend (Nitro)
│   ├── api/                      # REST API routes
│   ├── middleware/                # Server middleware
│   └── utils/                    # Server utilities (Prisma client, etc.)
├── prisma/schema.prisma          # Database schema
├── tests/
│   ├── unit/                     # Vitest tests
│   └── e2e/                      # Playwright tests
└── agents_docs/                  # Architecture & convention docs
```
