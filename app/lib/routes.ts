/**
 * app/lib/routes.ts — Centralised route, API endpoint and static asset paths.
 *
 * Every literal URL used by the client lives here. Components, pages,
 * composables, middleware and tests should import from this module rather
 * than typing paths inline. Renaming a route or an endpoint then becomes
 * a single edit, and the type checker flags any consumer left behind.
 *
 * The three sub-objects are kept separate so the intent is clear at the
 * call site:
 *   - ROUTES   → internal navigation (NuxtLink, navigateTo, middleware)
 *   - API      → server endpoints called via $fetch
 *   - ASSETS   → static files served from public/
 */

/** Internal page routes used by NuxtLink, navigateTo, and middleware. */
export const ROUTES = {
  home: '/',
  login: '/login',
  register: '/register',
  dashboard: '/dashboard',
  settings: '/settings',
  skills: {
    groceryList: '/skills/grocery-list',
    todoAtHome: '/skills/todo-at-home',
  },
} as const;

/** REST API endpoints. */
export const API = {
  auth: {
    register: '/api/auth/register',
  },
  household: {
    members: '/api/household/members',
  },
  skills: {
    grocery: {
      items: '/api/skills/grocery/items',
      itemsReorder: '/api/skills/grocery/items-reorder',
      itemsChecked: '/api/skills/grocery/items/checked',
      products: '/api/skills/grocery/products',
      categories: '/api/skills/grocery/categories',
    },
    todoAtHome: {
      tasks: '/api/skills/todo-at-home/tasks',
      contexts: '/api/skills/todo-at-home/contexts',
      contextsReorder: '/api/skills/todo-at-home/contexts-reorder',
      domains: '/api/skills/todo-at-home/domains',
      illustrations: '/api/skills/todo-at-home/illustrations',
      upload: '/api/skills/todo-at-home/upload',
      seed: '/api/skills/todo-at-home/seed',
    },
  },
} as const;

/** Static assets served from public/. */
export const ASSETS = {
  contexts: {
    /** Base path for context illustrations. Compose as `${base}/${set}/${slug}.webp`. */
    base: '/images/contexts',
    placeholder: '/images/contexts/placeholder.webp',
  },
} as const;
