/**
 * server/api/auth/register.post.ts — User registration endpoint.
 * POST /api/auth/register
 * Validates input with Zod, hashes password with bcrypt, creates user in DB.
 * Returns the new user (without passwordHash) on success.
 */
import { z } from 'zod'
import bcrypt from 'bcrypt'
import { prisma } from '~/server/utils/prisma'

// Zod schema for registration input validation
const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  name: z.string().min(1, 'Le nom est requis').optional(),
})

export default defineEventHandler(async (event) => {
  // 1. Validate input
  const body = await readBody(event)
  const parsed = registerSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: 'Données invalides',
      data: parsed.error.flatten(),
    })
  }

  // 2. Check if email is already taken
  const existingUser = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  })

  if (existingUser) {
    throw createError({
      statusCode: 409,
      message: 'Un compte avec cet email existe déjà',
    })
  }

  // 3. Hash password — 12 salt rounds is a good security/performance balance
  const passwordHash = await bcrypt.hash(parsed.data.password, 12)

  // 4. Create user
  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      passwordHash,
      name: parsed.data.name,
    },
    // Never return passwordHash to the client
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
    },
  })

  setResponseStatus(event, 201)
  return { data: user }
})
