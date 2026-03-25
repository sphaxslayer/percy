<!--
  components/layout/app-sidebar.vue — Collapsible sidebar navigation.
  Shows the list of registered skills from the skill registry.
  Collapses to icons-only mode on toggle. Hidden on mobile (replaced by mobile-nav).
-->
<script setup lang="ts">
import { LayoutDashboard, ChevronLeft, ChevronRight } from 'lucide-vue-next';
import { skills } from '~/config/skills';

const props = defineProps<{
  collapsed: boolean;
}>();

const emit = defineEmits<{
  'update:collapsed': [value: boolean];
}>();

function toggleCollapsed() {
  emit('update:collapsed', !props.collapsed);
}
</script>

<template>
  <aside
    class="hidden h-screen border-r border-percy-border bg-percy-bg-sidebar transition-all duration-200 md:flex md:flex-col"
    :class="collapsed ? 'w-16' : 'w-60'"
    data-testid="sidebar"
  >
    <!-- Sidebar header with app name -->
    <div class="flex h-14 items-center border-b border-percy-border px-4">
      <NuxtLink to="/dashboard" class="flex items-center gap-2 overflow-hidden">
        <LayoutDashboard class="h-5 w-5 shrink-0 text-percy-primary" />
        <span v-if="!collapsed" class="text-lg font-semibold text-percy-text-primary"> Percy </span>
      </NuxtLink>
    </div>

    <!-- Skill navigation links -->
    <nav class="flex-1 overflow-y-auto p-2">
      <NuxtLink
        to="/dashboard"
        class="mb-1 flex items-center gap-3 rounded-md px-3 py-2 text-sm text-percy-text-secondary hover:bg-percy-bg-nav"
        active-class="bg-percy-primary text-percy-primary-text font-medium"
        data-testid="sidebar-dashboard"
      >
        <LayoutDashboard class="h-4 w-4 shrink-0" />
        <span v-if="!collapsed">Dashboard</span>
      </NuxtLink>

      <!-- Dynamic skill links from registry -->
      <NuxtLink
        v-for="skill in skills.filter((s) => s.enabled)"
        :key="skill.id"
        :to="skill.route"
        class="mb-1 flex items-center gap-3 rounded-md px-3 py-2 text-sm text-percy-text-secondary hover:bg-percy-bg-nav"
        active-class="bg-percy-primary text-percy-primary-text font-medium"
        :data-testid="`sidebar-skill-${skill.id}`"
      >
        <!-- Skill icon rendered dynamically from lucide-vue-next -->
        <component :is="skill.iconComponent" v-if="skill.iconComponent" class="h-4 w-4 shrink-0" />
        <span v-if="!collapsed">{{ skill.name }}</span>
      </NuxtLink>
    </nav>

    <!-- Collapse toggle button -->
    <div class="border-t border-percy-border p-2">
      <button
        class="flex w-full items-center justify-center rounded-md p-2 text-percy-text-muted hover:bg-percy-bg-nav"
        data-testid="sidebar-toggle"
        @click="toggleCollapsed"
      >
        <ChevronLeft v-if="!collapsed" class="h-4 w-4" />
        <ChevronRight v-else class="h-4 w-4" />
      </button>
    </div>
  </aside>
</template>
