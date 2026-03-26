<!--
  TodoContextCard.vue — A single context card showing name, illustration,
  task count, progress bar, and task preview.
-->
<script setup lang="ts">
import type { TodoContext, TodoTask } from '~/types/todo';

const props = defineProps<{
  context: TodoContext;
  tasks: TodoTask[];
}>();

const emit = defineEmits<{
  click: [];
}>();

const openTasks = computed(() => props.tasks.filter((t) => t.status !== 'done'));
const doneTasks = computed(() => props.tasks.filter((t) => t.status === 'done'));
const progressPercent = computed(() => {
  if (props.tasks.length === 0) return 0;
  return Math.round((doneTasks.value.length / props.tasks.length) * 100);
});
const previewTasks = computed(() => openTasks.value.slice(0, 2));
</script>

<template>
  <div
    class="group cursor-pointer overflow-hidden rounded-lg border border-percy-border bg-percy-bg-card transition-shadow hover:shadow-md"
    :data-testid="`context-card-${context.id}`"
    @click="emit('click')"
  >
    <!-- Illustration -->
    <div class="h-28 w-full">
      <ContextIllustration
        :context-name="context.name"
        :is-global="context.isGlobal"
        :icon="context.icon ?? undefined"
        :color="context.color"
      />
    </div>

    <div class="space-y-2 p-3">
      <!-- Name + badge -->
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-bold text-percy-text-primary">
          {{ context.icon }} {{ context.name }}
        </h3>
        <span
          v-if="context.isGlobal"
          class="rounded-sm bg-percy-accent-light px-1.5 py-0.5 text-[11px] font-bold text-percy-accent-text"
        >
          Global
        </span>
      </div>

      <!-- Task count -->
      <p class="text-xs text-percy-text-muted">
        <template v-if="openTasks.length > 0">
          {{ openTasks.length }} tâche{{ openTasks.length > 1 ? 's' : '' }} ouverte{{ openTasks.length > 1 ? 's' : '' }}
        </template>
        <template v-else>
          Aucune tâche
        </template>
      </p>

      <!-- Progress bar -->
      <div v-if="tasks.length > 0" class="h-1.5 overflow-hidden rounded-full bg-percy-progress-bg">
        <div
          class="h-full rounded-full transition-all"
          :style="{ width: `${progressPercent}%`, background: 'var(--percy-progress-fill)' }"
        />
      </div>

      <!-- Task preview -->
      <div v-if="previewTasks.length > 0" class="space-y-1 pt-1">
        <div
          v-for="task in previewTasks"
          :key="task.id"
          class="flex items-center gap-1.5 text-xs text-percy-text-secondary"
        >
          <span class="shrink-0">•</span>
          <span class="truncate">{{ task.title }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
