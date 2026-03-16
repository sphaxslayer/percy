/**
 * server/utils/prisma.ts — Prisma client singleton.
 * In development, Nuxt's hot-reload creates new module instances on each change.
 * Without the singleton pattern, this would create multiple DB connections and
 * eventually exhaust the connection pool. We store the client on globalThis
 * to reuse it across hot reloads.
 */
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Log SQL queries in dev to help debug — disabled in production for performance
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
