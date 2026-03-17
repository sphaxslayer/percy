/**
 * server/api/auth/[...].ts — NextAuth.js catch-all handler.
 * Handles all /api/auth/* routes (login, session, csrf, etc.).
 * Uses the Credentials provider with email + password (bcrypt hashing).
 * JWT strategy: tokens stored in httpOnly cookies (no server-side sessions).
 */
import { NuxtAuthHandler } from '#auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcrypt';

export default NuxtAuthHandler({
  // Secret used to sign/encrypt JWTs — set via NUXT_AUTH_SECRET env var
  secret: useRuntimeConfig().authSecret,

  pages: {
    signIn: '/login',
  },

  providers: [
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (CredentialsProvider as any).default({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials: { email: string; password: string } | undefined) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          return null;
        }

        // Verify password against stored hash
        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);

        if (!isValid) {
          return null;
        }

        // Return user object — this becomes the JWT payload via callbacks below
        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],

  // JWT strategy (no server-side session storage needed)
  session: {
    strategy: 'jwt',
  },

  callbacks: {
    // Include user.id in the JWT token so we can use it in API routes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },

    // Include user.id in the session object so the client can access it
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    session({ session, token }: any) {
      if (session.user && token.id) {
        session.user.id = token.id;
      }
      return session;
    },
  },
});
