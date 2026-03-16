# DevOps Setup — Deployment, CI/CD, Infrastructure

## Role Context
When Claude reads this file, it should think as a **DevOps / Platform Engineer**.
Focus: reproducible builds, automated pipelines, containerization, deployment strategy.

## Containerization

### Dockerfile (multi-stage)
```dockerfile
# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable && pnpm build

# Stage 3: Production
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.output ./.output
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
```

### docker-compose.yml (development)
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://percy:percy@db:5432/percy
      - NUXT_AUTH_SECRET=dev-secret-change-in-prod
      - NUXT_AUTH_ORIGIN=http://localhost:3000
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: percy
      POSTGRES_PASSWORD: percy
      POSTGRES_DB: percy
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U percy"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
```

## CI/CD — GitHub Actions

### Pipeline Overview
```
Push to feature branch → Lint + Type-check + Unit Tests → PR Review
Merge to main → Full test suite (unit + e2e) → Build Docker → Deploy
```

### CI Workflow
```yaml
# .github/workflows/ci.yml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm test:unit

  e2e:
    runs-on: ubuntu-latest
    needs: quality
    if: github.ref == 'refs/heads/main'
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: percy_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps
      - run: pnpm db:push
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/percy_test
      - run: pnpm test:e2e
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/percy_test
          NUXT_AUTH_SECRET: test-secret
          NUXT_AUTH_ORIGIN: http://localhost:3000
```

## Hosting Recommendations

### Option A: VPS (Recommended for starting)
- **Provider**: Hetzner, OVH, or DigitalOcean (~5-10€/month)
- **Setup**: Docker Compose on VPS, Caddy or Traefik for reverse proxy + auto HTTPS
- **Pros**: Full control, cheap, simple
- **Cons**: Manual scaling, you manage updates

### Option B: Platform-as-a-Service
- **Provider**: Railway, Render, or Fly.io
- **Setup**: Connect GitHub repo, auto-deploy on push
- **Pros**: Zero infrastructure management, auto HTTPS, easy scaling
- **Cons**: More expensive at scale, less control

### Option C: Cloud (for later)
- **Provider**: AWS (ECS/Fargate) or GCP (Cloud Run)
- **Setup**: Container registry + orchestrator
- **Pros**: Scalable, enterprise-grade
- **Cons**: Complex, expensive for a personal project

**Recommendation**: Start with Option A (VPS + Docker Compose) or Option B (Railway/Render). Migrate to Option C only if usage demands it.

## Environment Management
```
.env.example    # Template — committed to git (no secrets)
.env            # Local dev — NEVER committed
.env.test       # Test environment — NEVER committed
```

Production secrets: use hosting provider's secret management (Railway secrets, GitHub Secrets for CI, etc.).

## Monitoring (Future)
- Health check endpoint: `server/api/health.get.ts` returning `{ status: 'ok', timestamp: Date.now() }`
- Logging: Nuxt built-in logger (stdout), aggregate with hosting provider
- Error tracking: Sentry (when ready). Add `@sentry/nuxt` module.
- Uptime: UptimeRobot or Better Uptime (free tier).
