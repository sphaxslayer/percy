/**
 * app/middleware/auth.ts — Client-side route guard.
 * Protects /dashboard and /skills/* routes — redirects to /login if not authenticated.
 * This is a Nuxt route middleware: it runs before page navigation on the client.
 */
export default defineNuxtRouteMiddleware((to) => {
  // Only protect dashboard and skills routes
  const protectedPaths = ['/dashboard', '/skills']
  const isProtected = protectedPaths.some((path) => to.path.startsWith(path))

  if (!isProtected) {
    return
  }

  // useAuth() comes from @sidebase/nuxt-auth — provides session state
  const { status } = useAuth()

  if (status.value === 'unauthenticated') {
    return navigateTo('/login')
  }
})
