/**
 * nuxt.config.ts — Main Nuxt 3 configuration.
 * Registers all modules (Tailwind, shadcn, Auth, Pinia) and sets TypeScript strict mode.
 */
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  // Use the app/ directory for all frontend code (pages, components, layouts, etc.)
  // This keeps frontend separate from server/ and prisma/
  future: {
    compatibilityVersion: 4,
  },

  devtools: { enabled: true },

  // Nuxt modules — order matters: Tailwind must load before shadcn
  modules: [
    '@nuxtjs/tailwindcss',
    'shadcn-nuxt',
    '@sidebase/nuxt-auth',
    '@pinia/nuxt',
    '@nuxt/eslint',
  ],

  // TypeScript strict mode everywhere
  // typeCheck is disabled in CI — CI runs lint + typecheck separately, and
  // vite-plugin-checker crashes the dev server on Node 20 in GitHub Actions.
  typescript: {
    strict: true,
    typeCheck: !process.env.CI,
  },

  // shadcn-vue configuration
  shadcn: {
    prefix: '', // No prefix — use component names directly (e.g., <Button />)
    componentDir: './app/components/ui', // Where shadcn components live
  },

  // Auth module configuration — configured in server/api/auth/[...].ts
  auth: {
    // baseURL is set via NUXT_AUTH_ORIGIN env var
    provider: {
      type: 'authjs',
    },
  },

  // Tailwind CSS — points to the main CSS file with @tailwind directives
  tailwindcss: {
    cssPath: '~/assets/css/main.css',
  },

  // Fix production build: bundle Vue in the SSR build to avoid CJS-to-ESM
  // default-export interop issues in Nitro's Rollup step.
  vite: {
    ssr: {
      noExternal: ['vue'],
    },
  },

  // Runtime config: secrets (server-only) and public (client + server)
  runtimeConfig: {
    authSecret: '', // NUXT_AUTH_SECRET env var
    databaseUrl: '', // DATABASE_URL env var (used by Prisma directly)
    public: {
      appName: 'Percy',
    },
  },
})
