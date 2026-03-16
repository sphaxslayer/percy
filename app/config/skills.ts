/**
 * app/config/skills.ts — Skill registry.
 * Central registry of all available skills. Drives the sidebar navigation,
 * dashboard grid, and skill routing.
 *
 * To add a new skill:
 * 1. Create the skill files (see agents_docs/architecture.md checklist)
 * 2. Import the icon component from lucide-vue-next
 * 3. Add a SkillDefinition entry to the `skills` array below
 */
import type { Component } from 'vue'

/**
 * Defines metadata for a skill module.
 * Each skill must declare this to appear in the sidebar and dashboard.
 */
export interface SkillDefinition {
  /** Unique kebab-case identifier (e.g., "grocery-list") */
  id: string
  /** Display name shown in sidebar and cards (e.g., "Liste de courses") */
  name: string
  /** One-line description shown on the dashboard card */
  description: string
  /** Lucide icon name for reference (e.g., "ShoppingCart") */
  icon: string
  /** Resolved Vue component for the icon (from lucide-vue-next) */
  iconComponent?: Component
  /** Route path to the skill page (e.g., "/skills/grocery-list") */
  route: string
  /** Optional: component name for a dashboard summary widget */
  dashboardComponent?: string
  /** Whether this skill is active and visible to the user */
  enabled: boolean
}

/**
 * Registered skills — add new entries here as skills are developed.
 * Skills with enabled: false won't appear in the sidebar or dashboard.
 */
export const skills: SkillDefinition[] = [
  // No skills yet — the first one will be added in the next phase.
  // Example:
  // {
  //   id: 'grocery-list',
  //   name: 'Liste de courses',
  //   description: 'Gérez vos listes de courses intelligemment',
  //   icon: 'ShoppingCart',
  //   iconComponent: ShoppingCart,
  //   route: '/skills/grocery-list',
  //   enabled: true,
  // },
]
