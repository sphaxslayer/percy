# Architecture — System Design & Conventions

## Role Context
When Claude reads this file, it should think as a **Senior Software Architect**.
Focus: system design coherence, module boundaries, scalability, maintainability.

## Core Principles

### 1. Modular Skill Architecture
Every feature the user interacts with is a "Skill". A Skill is an isolated, self-contained module.

**Why**: The application will grow incrementally. Each skill should be addable/removable without affecting others.

**Rules**:
- A Skill NEVER imports from another Skill's directory.
- Shared logic goes in `composables/` or `server/utils/`.
- If two skills need the same data, expose it via a shared composable or API, not direct cross-imports.

### 2. Fullstack Nuxt (No Separate Backend)
We use Nuxt 3's built-in Nitro server for the backend. This means:
- No separate Express/Fastify server.
- API routes live in `server/api/`.
- Server middleware in `server/middleware/`.
- Server utilities in `server/utils/`.

**Why**: Simplifies deployment (single build), reduces infrastructure complexity, and keeps the dev experience unified.

**When to reconsider**: If we need WebSockets, long-running jobs, or heavy background processing, we'll extract a separate service. Not before.

### 3. Database Layer
- Prisma ORM for all DB access.
- PostgreSQL as the single source of truth.
- Migrations managed via Prisma Migrate.
- Each Skill that needs persistent data defines its models in `prisma/schema.prisma`.

**Schema convention**:
```prisma
model SkillTodo {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  title     String
  completed Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```
- Prefix Skill-specific models with `Skill` + skill name.
- Always include `userId` relation for multi-user support.
- Always include `createdAt` and `updatedAt`.

### 4. Authentication & Authorization
- Use `sidebase/nuxt-auth` (NextAuth.js port for Nuxt 3).
- Default provider: Credentials (email + password, bcrypt hashing).
- Ready for OAuth providers (Google, GitHub) — just add config.
- Session strategy: JWT stored in httpOnly cookie.
- Every `server/api/` route that handles user data MUST check authentication via `getServerSession()`.

### 5. Adding a New Skill — Checklist
1. Create the page: `app/pages/skills/<name>.vue`
2. Create components dir: `app/components/skills/<name>/`
3. Create composable: `app/composables/use-<name>.ts`
4. Create API routes: `server/api/skills/<name>/`
5. If DB needed: add models to `prisma/schema.prisma` + run migration
6. Register the skill in the dashboard skill registry (`app/config/skills.ts`)
7. Write unit tests: `tests/unit/skills/<name>/`
8. Write at least one e2e test: `tests/e2e/skills/<name>.spec.ts`

### 6. API Design Conventions
- RESTful routes.
- Versioning: not needed initially (single consumer). Add `/v1/` prefix only when we have external consumers.
- Response format:
```typescript
// Success
{ data: T }

// Error
{ error: { code: string, message: string } }
```
- HTTP status codes: 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 404 Not Found, 500 Internal Error.
- Input validation: Zod schemas in `server/api/` route handlers. Always validate before processing.

### 7. Environment & Config
- `.env` for secrets (DB URL, auth secrets). NEVER commit.
- `nuxt.config.ts` for public runtime config.
- Use `useRuntimeConfig()` server-side, `useAppConfig()` client-side.

### 8. Future Considerations (Not Now)
- **Mobile app**: PWA first (Nuxt PWA module), then consider Capacitor if native features needed.
- **Background jobs**: If needed, add a job queue (BullMQ + Redis). Extract to a separate worker process.
- **Real-time**: If needed, add WebSocket support via Nitro's built-in WS or a separate Socket.io service.
- **AI/LLM integration**: Skills may call external APIs (OpenAI, Claude). Wrap in a `server/utils/ai-client.ts` abstraction.
