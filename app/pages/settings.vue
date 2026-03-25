<!--
  pages/settings.vue — User preferences page.
  Allows selecting color theme (Terracotta / Saphir), dark mode (light/dark/system),
  and illustration set (Warm / Daylight). All 4 choices are independent.
-->
<script setup lang="ts">
import { Sun, Moon, Monitor } from 'lucide-vue-next';
import { useThemeStore } from '~/stores/use-theme-store';
import type { ThemeName, IllustrationSet } from '~/stores/use-theme-store';

definePageMeta({
  middleware: 'auth',
});

const themeStore = useThemeStore();
const colorMode = useColorMode();

/** Theme preview colors — static swatches for each theme card */
const themeOptions: { id: ThemeName; label: string; colors: string[] }[] = [
  {
    id: 'terracotta',
    label: 'Terracotta & Sauge',
    colors: ['#C4653A', '#8A9A5B', '#B8860B', '#FBF7F2'],
  },
  {
    id: 'saphir',
    label: 'Saphir & Améthyste',
    colors: ['#3566A8', '#7A68B8', '#C9A033', '#F4F7FC'],
  },
];

const illustrationOptions: { id: IllustrationSet; label: string; description: string }[] = [
  { id: 'warm', label: 'Warm', description: 'Ambiance dorée, heure dorée' },
  { id: 'daylight', label: 'Daylight', description: 'Lumière neutre, aérée' },
];

const colorModeOptions = [
  { value: 'light', label: 'Clair', icon: Sun },
  { value: 'dark', label: 'Sombre', icon: Moon },
  { value: 'system', label: 'Système', icon: Monitor },
] as const;

function selectTheme(t: ThemeName) {
  themeStore.setTheme(t);
}

function selectIllustrationSet(s: IllustrationSet) {
  themeStore.setIllustrationSet(s);
}

function selectColorMode(mode: string) {
  colorMode.preference = mode;
}
</script>

<template>
  <div class="mx-auto max-w-2xl space-y-8 p-4 sm:p-6">
    <h1 class="text-2xl font-bold text-percy-text-primary">Réglages</h1>

    <!-- Color theme selection -->
    <section class="space-y-3">
      <h2 class="text-lg font-semibold text-percy-text-primary">Thème couleur</h2>
      <p class="text-sm text-percy-text-muted">Choisissez l'ambiance visuelle de Percy</p>

      <div class="grid grid-cols-2 gap-4">
        <button
          v-for="option in themeOptions"
          :key="option.id"
          class="group relative rounded-lg border-2 p-4 text-left transition-all"
          :class="
            themeStore.theme === option.id
              ? 'border-percy-primary bg-percy-primary-light'
              : 'border-percy-border bg-percy-bg-card hover:border-percy-primary/50'
          "
          @click="selectTheme(option.id)"
        >
          <!-- Color swatches preview -->
          <div class="mb-3 flex gap-1.5">
            <div
              v-for="(color, i) in option.colors"
              :key="i"
              class="h-6 w-6 rounded-full border border-percy-border"
              :style="{ backgroundColor: color }"
            />
          </div>
          <p class="text-sm font-semibold text-percy-text-primary">{{ option.label }}</p>

          <!-- Active indicator -->
          <div
            v-if="themeStore.theme === option.id"
            class="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-percy-primary"
          />
        </button>
      </div>
    </section>

    <GradientDivider />

    <!-- Dark mode toggle -->
    <section class="space-y-3">
      <h2 class="text-lg font-semibold text-percy-text-primary">Mode d'affichage</h2>
      <p class="text-sm text-percy-text-muted">Clair, sombre, ou selon votre système</p>

      <div class="inline-flex gap-0.5 rounded-lg bg-percy-bg-nav p-0.5">
        <button
          v-for="option in colorModeOptions"
          :key="option.value"
          class="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-colors"
          :class="
            colorMode.preference === option.value
              ? 'bg-percy-primary text-percy-primary-text'
              : 'text-percy-text-muted hover:bg-percy-bg-card'
          "
          @click="selectColorMode(option.value)"
        >
          <component :is="option.icon" class="h-3.5 w-3.5" />
          {{ option.label }}
        </button>
      </div>
    </section>

    <GradientDivider />

    <!-- Illustration set selection -->
    <section class="space-y-3">
      <h2 class="text-lg font-semibold text-percy-text-primary">Jeu d'illustrations</h2>
      <p class="text-sm text-percy-text-muted">Indépendant du thème couleur</p>

      <div class="grid grid-cols-2 gap-4">
        <button
          v-for="option in illustrationOptions"
          :key="option.id"
          class="group relative overflow-hidden rounded-lg border-2 text-left transition-all"
          :class="
            themeStore.illustrationSet === option.id
              ? 'border-percy-primary'
              : 'border-percy-border hover:border-percy-primary/50'
          "
          @click="selectIllustrationSet(option.id)"
        >
          <!-- Preview image -->
          <div class="h-28 w-full overflow-hidden">
            <img
              :src="`/images/contexts/${option.id}/kitchen.webp`"
              :alt="option.label"
              class="h-full w-full object-cover"
            >
          </div>
          <div class="p-3">
            <p class="text-sm font-semibold text-percy-text-primary">{{ option.label }}</p>
            <p class="text-xs text-percy-text-muted">{{ option.description }}</p>
          </div>

          <!-- Active indicator -->
          <div
            v-if="themeStore.illustrationSet === option.id"
            class="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-percy-primary"
          />
        </button>
      </div>
    </section>
  </div>
</template>