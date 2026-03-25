<!--
  components/layout/mobile-nav.vue — Mobile navigation overlay.
  Replaces the sidebar on screens < md breakpoint.
  Shows as a slide-in overlay with skill navigation links.
-->
<script setup lang="ts">
import { X, LayoutDashboard, Settings } from 'lucide-vue-next';
import { skills } from '~/config/skills';

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
}>();

function close() {
  emit('update:open', false);
}
</script>

<template>
  <!-- Backdrop overlay -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="props.open" class="fixed inset-0 z-40 bg-black/50 md:hidden" @click="close" />
    </Transition>

    <!-- Slide-in navigation panel -->
    <Transition name="slide">
      <nav
        v-if="props.open"
        class="fixed inset-y-0 left-0 z-50 w-64 bg-percy-bg-sidebar shadow-xl md:hidden"
        data-testid="mobile-nav"
      >
        <!-- Header with close button -->
        <div class="flex h-14 items-center justify-between border-b border-percy-border px-4">
          <span class="text-lg font-semibold text-percy-text-primary">Percy</span>
          <button
            class="rounded-md p-1 text-percy-text-muted hover:bg-percy-bg-nav"
            data-testid="mobile-nav-close"
            @click="close"
          >
            <X class="h-5 w-5" />
          </button>
        </div>

        <!-- Navigation links -->
        <div class="overflow-y-auto p-2">
          <NuxtLink
            to="/dashboard"
            class="mb-1 flex items-center gap-3 rounded-md px-3 py-2 text-sm text-percy-text-secondary hover:bg-percy-bg-nav"
            active-class="bg-percy-primary text-percy-primary-text font-medium"
            @click="close"
          >
            <LayoutDashboard class="h-4 w-4 shrink-0" />
            Dashboard
          </NuxtLink>

          <NuxtLink
            v-for="skill in skills.filter((s) => s.enabled)"
            :key="skill.id"
            :to="skill.route"
            class="mb-1 flex items-center gap-3 rounded-md px-3 py-2 text-sm text-percy-text-secondary hover:bg-percy-bg-nav"
            active-class="bg-percy-primary text-percy-primary-text font-medium"
            @click="close"
          >
            <component
              :is="skill.iconComponent"
              v-if="skill.iconComponent"
              class="h-4 w-4 shrink-0"
            />
            {{ skill.name }}
          </NuxtLink>

          <!-- Settings link -->
          <div class="mt-2 border-t border-percy-border pt-2">
            <NuxtLink
              to="/settings"
              class="mb-1 flex items-center gap-3 rounded-md px-3 py-2 text-sm text-percy-text-secondary hover:bg-percy-bg-nav"
              active-class="bg-percy-primary text-percy-primary-text font-medium"
              @click="close"
            >
              <Settings class="h-4 w-4 shrink-0" />
              Réglages
            </NuxtLink>
          </div>
        </div>
      </nav>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Fade transition for backdrop */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 200ms ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Slide transition for navigation panel */
.slide-enter-active,
.slide-leave-active {
  transition: transform 200ms ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
}
</style>
