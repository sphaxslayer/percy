<!--
  pages/dashboard.vue — Main dashboard page.
  Shows a grid of SkillCards for all enabled skills from the registry.
  Displays an empty state with a welcome message when no skills are enabled.
-->
<script setup lang="ts">
import { Sparkles } from 'lucide-vue-next'
import { skills } from '~/config/skills'

// Protect this page — requires authentication
definePageMeta({
  middleware: 'auth',
})

// Filter to only show enabled skills
const enabledSkills = computed(() => skills.filter((s) => s.enabled))
</script>

<template>
  <div>
    <!-- Page title -->
    <h1 class="mb-6 text-2xl font-bold text-slate-900" data-testid="dashboard-title">
      Dashboard
    </h1>

    <!-- Skills grid — responsive: 1 col mobile, 2 tablet, 3 desktop -->
    <div
      v-if="enabledSkills.length > 0"
      class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
      data-testid="skills-grid"
    >
      <SkillCard
        v-for="skill in enabledSkills"
        :key="skill.id"
        :skill="skill"
      >
        <!-- Skill-specific dashboard summaries -->
        <GrocerySummary v-if="skill.id === 'grocery-list'" />
      </SkillCard>
    </div>

    <!-- Empty state — shown when no skills are enabled -->
    <div
      v-else
      class="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white px-6 py-16 text-center"
      data-testid="empty-state"
    >
      <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <Sparkles class="h-6 w-6 text-primary" />
      </div>
      <h2 class="mb-2 text-lg font-semibold text-slate-900">
        Bienvenue sur Percy !
      </h2>
      <p class="max-w-sm text-sm text-slate-600">
        Votre assistant personnel est prêt. Les skills seront ajoutés ici
        au fur et à mesure de leur développement.
      </p>
    </div>
  </div>
</template>
