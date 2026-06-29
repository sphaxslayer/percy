/**
 * prisma.config.ts — Prisma 7 CLI configuration.
 * Holds the database connection URL for CLI commands (migrate, db push, db execute).
 * Runtime queries instantiate PrismaClient with @prisma/adapter-pg (see server/utils/prisma.ts).
 */
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// We read DATABASE_URL via process.env (with empty fallback) instead of
// Prisma's strict env() helper. The helper throws when the var is unset,
// which breaks the install-time `prisma generate` step in CI (where
// DATABASE_URL is only set for the steps that actually touch the database).
// `prisma generate` only reads the schema and doesn't need a connection,
// so an empty URL is fine. Real DB operations (db push, migrate, etc.)
// will fail with a clear "connection failed" error if the var is missing.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL ?? '',
  },
});
