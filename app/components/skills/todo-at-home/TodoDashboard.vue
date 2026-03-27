<!--
  TodoDashboard.vue — Drag-and-drop grid of context cards with progress.
  The global context is pinned first and not draggable.
  All other contexts can be reordered via drag handles.
-->
<script setup lang="ts">
import draggable from 'vuedraggable';
import { GripVertical } from 'lucide-vue-next';
import type { TodoContext, TodoTask } from '~/types/todo';

const props = defineProps<{
  contexts: TodoContext[];
  tasks: TodoTask[];
}>();

const emit = defineEmits<{
  'select-context': [contextId: string];
  'reorder': [items: Array<{ id: string; sortOrder: number }>];
}>();

// The global context is pinned; remaining contexts are draggable
const globalContext = computed(() => props.contexts.find((c) => c.isGlobal) ?? null);
const draggableContexts = ref<TodoContext[]>([]);

// Keep draggableContexts in sync with prop (non-global, sorted by sortOrder)
watch(
  () => props.contexts,
  (list) => {
    draggableContexts.value = [...list]
      .filter((c) => !c.isGlobal)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  },
  { immediate: true },
);

function getTasksForContext(contextId: string) {
  return props.tasks.filter((t) => t.contextId === contextId);
}

function onDragEnd() {
  // Assign new sortOrder values based on current position in the list
  const updated = draggableContexts.value.map((ctx, idx) => ({
    id: ctx.id,
    sortOrder: idx + 1, // global context occupies sortOrder=0
  }));
  emit('reorder', updated);
}
</script>

<template>
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
    <!-- Global context card — pinned, not draggable -->
    <TodoContextCard
      v-if="globalContext"
      :context="globalContext"
      :tasks="getTasksForContext(globalContext.id)"
      @click="emit('select-context', globalContext.id)"
    />

    <!-- Draggable non-global contexts -->
    <draggable
      v-model="draggableContexts"
      item-key="id"
      handle=".drag-handle"
      :animation="150"
      ghost-class="opacity-30"
      class="contents"
      @end="onDragEnd"
    >
      <template #item="{ element: context }">
        <div class="group relative">
          <!-- Drag handle — top-left corner of the card, visible on hover -->
          <button
            class="drag-handle absolute left-1.5 top-1.5 z-10 cursor-grab rounded p-0.5 text-white/70 opacity-0 transition-opacity hover:text-white active:cursor-grabbing group-hover:opacity-100 focus:opacity-100"
            aria-label="Réordonner"
            @click.stop
          >
            <GripVertical class="h-4 w-4" />
          </button>

          <TodoContextCard
            :context="context"
            :tasks="getTasksForContext(context.id)"
            @click="emit('select-context', context.id)"
          />
        </div>
      </template>
    </draggable>
  </div>
</template>
