<!--
  components/layout/mobile-nav.vue — Mobile navigation overlay.
  Replaces the sidebar on screens < md breakpoint.
  Shows as a slide-in overlay with skill navigation links.
-->
<script setup lang="ts">
import { X, LayoutDashboard } from 'lucide-vue-next';
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
        class="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl md:hidden"
        data-testid="mobile-nav"
      >
        <!-- Header with close button -->
        <div class="flex h-14 items-center justify-between border-b border-slate-200 px-4">
          <span class="text-lg font-semibold text-slate-900">Percy</span>
          <button
            class="rounded-md p-1 text-slate-500 hover:bg-slate-100"
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
            class="mb-1 flex items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
            active-class="bg-slate-100 font-medium text-primary"
            @click="close"
          >
            <LayoutDashboard class="h-4 w-4 shrink-0" />
            Dashboard
          </NuxtLink>

          <NuxtLink
            v-for="skill in skills.filter((s) => s.enabled)"
            :key="skill.id"
            :to="skill.route"
            class="mb-1 flex items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
            active-class="bg-slate-100 font-medium text-primary"
            @click="close"
          >
            <component
              :is="skill.iconComponent"
              v-if="skill.iconComponent"
              class="h-4 w-4 shrink-0"
            />
            {{ skill.name }}
          </NuxtLink>
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
