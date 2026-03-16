# Backend Conventions — Nitro Server Routes

## Role Context
When Claude reads this file, it should think as a **Senior Backend Engineer**.
Focus: API design, data validation, security, error handling, database patterns.

## API Route Structure

Nuxt 3 uses file-based routing for API endpoints via Nitro. The file name determines the HTTP method and path.

```
server/api/
├── auth/
│   ├── register.post.ts        # POST /api/auth/register
│   └── [...].ts                # Catch-all for nuxt-auth
├── users/
│   ├── me.get.ts               # GET /api/users/me
│   └── me.patch.ts             # PATCH /api/users/me
└── skills/
    └── todos/
        ├── index.get.ts        # GET /api/skills/todos
        ├── index.post.ts       # POST /api/skills/todos
        ├── [id].get.ts         # GET /api/skills/todos/:id
        ├── [id].patch.ts       # PATCH /api/skills/todos/:id
        └── [id].delete.ts      # DELETE /api/skills/todos/:id
```

## Route Handler Template

```typescript
// server/api/skills/todos/index.post.ts
import { z } from 'zod'
import { getServerSession } from '#auth'
import { prisma } from '~/server/utils/prisma'

// 1. Define input schema
const createTodoSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
})

export default defineEventHandler(async (event) => {
  // 2. Check authentication
  const session = await getServerSession(event)
  if (!session?.user?.id) {
    throw createError({ statusCode: 401, message: 'Non authentifié' })
  }

  // 3. Validate input
  const body = await readBody(event)
  const parsed = createTodoSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: 'Données invalides',
      data: parsed.error.flatten()
    })
  }

  // 4. Business logic
  const todo = await prisma.skillTodo.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      userId: session.user.id,
    }
  })

  // 5. Return response
  setResponseStatus(event, 201)
  return { data: todo }
})
```

## Key Rules

### Authentication
- EVERY route handling user data MUST verify the session.
- Use `getServerSession(event)` from `#auth`.
- Extract `session.user.id` to scope all queries to the current user.
- Never trust client-provided userId.

### Input Validation
- Use Zod for ALL inputs (body, query params, route params).
- Define schemas at the top of each route file.
- Use `.safeParse()` (not `.parse()`) to handle errors gracefully.
- Return structured validation errors with `error.flatten()`.

### Error Handling
- Use `createError()` from Nitro for all error responses.
- Always include `statusCode` and `message`.
- Optional: `data` field for structured error details.
- Never expose internal errors (stack traces, SQL errors) to the client.

### Database Access
- Always scope queries by `userId`: `where: { userId: session.user.id }`.
- Use Prisma transactions for multi-step operations.
- Prefer `findUnique` over `findFirst` when querying by unique field.
- Always `select` only the fields you need for list endpoints.

```typescript
// Good — scoped and selective
const todos = await prisma.skillTodo.findMany({
  where: { userId: session.user.id },
  select: { id: true, title: true, completed: true, createdAt: true },
  orderBy: { createdAt: 'desc' },
})

// Bad — returns everything, not scoped
const todos = await prisma.skillTodo.findMany()
```

### Ownership Checks
For single-resource routes (`[id].get.ts`, `[id].patch.ts`, `[id].delete.ts`):
```typescript
const id = getRouterParam(event, 'id')
const todo = await prisma.skillTodo.findUnique({
  where: { id }
})

if (!todo) {
  throw createError({ statusCode: 404, message: 'Ressource non trouvée' })
}

if (todo.userId !== session.user.id) {
  throw createError({ statusCode: 404, message: 'Ressource non trouvée' })
  // Return 404, not 403 — don't reveal existence to non-owners
}
```

## Prisma Setup

```typescript
// server/utils/prisma.ts
import { PrismaClient } from '@prisma/client'

// Prevent multiple instances in dev (hot reload)
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

## Server Middleware

```typescript
// server/middleware/log.ts — example: request logging
export default defineEventHandler((event) => {
  const method = getMethod(event)
  const path = getRequestURL(event).pathname
  console.log(`[${new Date().toISOString()}] ${method} ${path}`)
})
```

- Middleware runs on EVERY request (API + pages).
- Keep middleware lightweight. Don't do DB calls in global middleware.
- For route-specific checks, use logic inside the route handler.

## Environment Variables
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/percy"
NUXT_AUTH_SECRET="<random-32-char-string>"
NUXT_AUTH_ORIGIN="http://localhost:3000"
```

Access via `useRuntimeConfig()` in server routes:
```typescript
const config = useRuntimeConfig()
// config.databaseUrl, config.authSecret, etc.
```
