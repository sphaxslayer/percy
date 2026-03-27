<!--
  TodoSearchResults.vue — Flat task list shown when search or filter chips are active.
  Replaces the context card grid so results are immediately visible.
  Each task shows a context badge so you know where it lives.
-->
<script setup lang="ts">
import type { TodoTask, ColorMode } from '~/types/todo';

defineProps<{
  tasks: TodoTask[];
  colorMode: ColorMode;
}>();

const emit = defineEmits<{
  toggle: [taskId: string];
  edit: [taskId: string];
  delete: [taskId: string];
  'toggle-subtask': [taskId: string, subtaskId: string];
}>();
</script>

<template>
  <div class="space-y-2">

    <!-- Result count -->
    <p class="text-xs text-percy-text-muted">
      <template v-if="tasks.length > 0">
        {{ tasks.length }} tâche{{ tasks.length > 1 ? 's' : '' }} trouvée{{ tasks.length > 1 ? 's' : '' }}
      </template>
      <template v-else>
        Aucune tâche ne correspond
      </template>
    </p>

    <!-- Task list -->
    <div class="space-y-2">
      <div v-for="task in tasks" :key="task.id" class="space-y-1">
        <!-- Context badge above each task -->
        <span
          class="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[11px] font-semibold"
          :style="{ backgroundColor: task.context.color + '22', color: task.context.color }"
        >
          {{ task.context.icon ?? '' }} {{ task.context.name }}
        </span>

        <TodoTaskItem
          :task="task"
          :color-mode="colorMode"
          @toggle="emit('toggle', $event)"
          @edit="emit('edit', $event)"
          @delete="emit('delete', $event)"
          @toggle-subtask="(tid, sid) => emit('toggle-subtask', tid, sid)"
        />
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="tasks.length === 0" class="py-10 text-center">
      <p class="text-4xl">🔍</p>
      <p class="mt-2 text-sm font-medium text-percy-text-primary">Aucun résultat</p>
      <p class="text-xs text-percy-text-muted">Essayez un autre mot-clé ou filtre</p>
    </div>

  </div>
</template>
