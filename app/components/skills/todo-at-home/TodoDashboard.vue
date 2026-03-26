<!--
  TodoDashboard.vue — Grid of context cards with progress.
  Shows add context/quick add forms and the full context grid.
-->
<script setup lang="ts">
import type { TodoContext, TodoTask } from '~/types/todo';

defineProps<{
  contexts: TodoContext[];
  tasks: TodoTask[];
}>();

const emit = defineEmits<{
  'select-context': [contextId: string];
}>();

function getTasksForContext(contextId: string, tasks: TodoTask[]) {
  return tasks.filter((t) => t.contextId === contextId);
}
</script>

<template>
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
    <TodoContextCard
      v-for="context in contexts"
      :key="context.id"
      :context="context"
      :tasks="getTasksForContext(context.id, tasks)"
      @click="emit('select-context', context.id)"
    />
  </div>
</template>
