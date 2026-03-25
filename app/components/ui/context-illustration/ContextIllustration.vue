<!--
  ContextIllustration.vue — Displays an isometric illustration for a context card.
  Falls back to a colored rectangle with emoji if the image fails to load.
-->
<script setup lang="ts">
import { useContextIllustration } from '~/composables/use-context-illustration';

const props = defineProps<{
  contextName: string;
  isGlobal?: boolean;
  icon?: string;
  color?: string;
}>();

const { getIllustrationPath } = useContextIllustration();
const src = computed(() => getIllustrationPath(props.contextName, props.isGlobal ?? false));
const hasError = ref(false);
</script>

<template>
  <div class="w-full h-full rounded-lg overflow-hidden">
    <img
      v-if="!hasError"
      :src="src"
      :alt="contextName"
      class="w-full h-full object-cover"
      @error="hasError = true"
    >
    <div
      v-else
      class="w-full h-full flex items-center justify-center text-4xl"
      :style="{ backgroundColor: color || 'var(--percy-bg-nav)' }"
    >
      {{ icon || '📋' }}
    </div>
  </div>
</template>