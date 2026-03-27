<!--
  TodoDashboard.vue — Drag-and-drop grid of context cards with progress.
  All contexts (including Global) are draggable via their title row.
-->
<script setup lang="ts">
import draggable from 'vuedraggable';
import type { TodoContext, TodoTask } from '~/types/todo';

const props = defineProps<{
  contexts: TodoContext[];
  tasks: TodoTask[];
}>();

const emit = defineEmits<{
  'select-context': [contextId: string];
  'reorder': [items: Array<{ id: string; sortOrder: number }>];
}>();

const draggableContexts = ref<TodoContext[]>([]);

// Keep in sync with prop, preserving DB sort order
watch(
  () => props.contexts,
  (list) => {
    draggableContexts.value = [...list].sort((a, b) => a.sortOrder - b.sortOrder);
  },
  { immediate: true },
);

function getTasksForContext(contextId: string) {
  return props.tasks.filter((t) => t.contextId === contextId);
}

function onDragEnd() {
  const updated = draggableContexts.value.map((ctx, idx) => ({
    id: ctx.id,
    sortOrder: idx,
  }));
  emit('reorder', updated);
}
</script>

<template>
  <draggable
    v-model="draggableContexts"
    item-key="id"
    handle=".drag-handle"
    :animation="150"
    ghost-class="opacity-30"
    class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
    @end="onDragEnd"
  >
    <template #item="{ element: context }">
      <TodoContextCard
        :context="context"
        :tasks="getTasksForContext(context.id)"
        @click="emit('select-context', context.id)"
      />
    </template>
  </draggable>
</template>
