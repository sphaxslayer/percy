/**
 * server/utils/auth.ts — Auth utilities for API routes.
 * Extracts the authenticated user ID from the session,
 * or throws a 401 error if not authenticated.
 */
import { getServerSession } from '#auth'
import type { H3Event } from 'h3'

export async function requireUserId(event: H3Event): Promise<string> {
  const session = await getServerSession(event)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) {
    throw createError({ statusCode: 401, message: 'Non authentifié' })
  }
  return userId
}
