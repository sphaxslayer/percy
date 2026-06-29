/**
 * app/config/skills.ts — Skill registry.
 * Central registry of all available skills. Drives the sidebar navigation,
 * dashboard grid, and skill routing.
 *
 * To add a new skill:
 * 1. Create the skill files (see agents_docs/architecture.md checklist)
 * 2. Import the icon component from lucide-vue-next
 * 3. If the skill has a dashboard preview widget, register it via
 *    `defineAsyncComponent` below so it is lazy-loaded on the dashboard
 * 4. Add a SkillDefinition entry to the `skills` array below
 */
import { type Component, defineAsyncComponent } from 'vue';
import { ShoppingCart, ClipboardList, ChefHat } from 'lucide-vue-next';
import { ROUTES } from '~/lib/routes';

/**
 * Defines metadata for a skill module.
 * Each skill must declare this to appear in the sidebar and dashboard.
 */
export interface SkillDefinition {
  /** Unique kebab-case identifier (e.g., "grocery-list") */
  id: string;
  /** Display name shown in sidebar and cards (e.g., "Liste de courses") */
  name: string;
  /** One-line description shown on the dashboard card */
  description: string;
  /** Lucide icon name for reference (e.g., "ShoppingCart") */
  icon: string;
  /** Resolved Vue component for the icon (from lucide-vue-next) */
  iconComponent?: Component;
  /** Route path to the skill page (e.g., "/skills/grocery-list") */
  route: string;
  /**
   * Optional dashboard preview component (lazy-loaded). When set, it is
   * rendered inside the SkillCard on the dashboard, wrapped in <ClientOnly>.
   * Use `defineAsyncComponent(() => import('~/components/...'))`.
   */
  dashboardComponent?: Component;
  /** Whether this skill is active and visible to the user */
  enabled: boolean;
}

/**
 * Registered skills — add new entries here as skills are developed.
 * Skills with enabled: false won't appear in the sidebar or dashboard.
 */
export const skills: SkillDefinition[] = [
  {
    id: 'grocery-list',
    name: 'Liste de courses',
    description: 'Gérez vos listes de courses intelligemment',
    icon: 'ShoppingCart',
    iconComponent: ShoppingCart as Component,
    route: ROUTES.skills.groceryList,
    dashboardComponent: defineAsyncComponent(
      () => import('~/components/skills/grocery/grocery-summary.vue'),
    ),
    enabled: true,
  },
  {
    id: 'todo-at-home',
    name: 'Tâches à la maison',
    description: 'Organisez vos tâches domestiques par pièce et contexte',
    icon: 'ClipboardList',
    iconComponent: ClipboardList as Component,
    route: ROUTES.skills.todoAtHome,
    dashboardComponent: defineAsyncComponent(
      () => import('~/components/skills/todo-at-home/todo-summary.vue'),
    ),
    enabled: true,
  },
  {
    id: 'meal-planner',
    name: 'Planificateur de repas',
    description: 'Gérez vos recettes et planifiez les repas de la semaine',
    icon: 'ChefHat',
    iconComponent: ChefHat as Component,
    route: ROUTES.skills.mealPlanner,
    dashboardComponent: defineAsyncComponent(
      () => import('~/components/skills/meal-planner/meal-planner-summary.vue'),
    ),
    enabled: true,
  },
];
