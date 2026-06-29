/**
 * server/utils/prisma.ts — Prisma client singleton (Prisma 7).
 * Prisma 7 uses the driver adapter pattern: the connection string is passed
 * to the adapter at runtime, not via schema.prisma. The PrismaClient is
 * reused across hot reloads via globalThis in dev to avoid exhausting the
 * DB connection pool.
 */
import { PrismaClient } from '~~/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createClient(): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
