<!--
  TodoTaskItem.vue — A single task row with checkbox, info, and subtasks.
-->
<script setup lang="ts">
import { ChevronDown, ChevronRight, Trash2, Pencil } from 'lucide-vue-next';
import type { TodoTask } from '~/types/todo';

const props = defineProps<{
  task: TodoTask;
  colorMode?: 'context' | 'assignee' | 'priority';
}>();

const emit = defineEmits<{
  toggle: [taskId: string];
  edit: [taskId: string];
  delete: [taskId: string];
  'toggle-subtask': [taskId: string, subtaskId: string];
}>();

const expanded = ref(false);
const hasSubtasks = computed(() => props.task.subtasks.length > 0);
const completedSubtasks = computed(() => props.task.subtasks.filter((s) => s.completed).length);

const priorityColors: Record<string, string> = {
  low: 'bg-percy-success-light text-percy-success',
  normal: 'bg-percy-warning-light text-percy-warning',
  high: 'bg-percy-danger-light text-percy-danger',
};

const priorityLabels: Record<string, string> = {
  low: 'Basse',
  normal: 'Normale',
  high: 'Haute',
};

const statusIcons: Record<string, string> = {
  todo: '☐',
  in_progress: '🔄',
  done: '☑',
};

/** The accent color strip on the left, based on colorMode */
const accentColor = computed(() => {
  if (props.colorMode === 'priority') {
    return { low: 'var(--percy-success)', normal: 'var(--percy-warning)', high: 'var(--percy-danger)' }[props.task.priority];
  }
  if (props.colorMode === 'assignee') {
    return props.task.color ?? props.task.context.color;
  }
  // Default: context color
  return props.task.context.color;
});

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}
</script>

<template>
  <div
    class="group flex gap-2 rounded-lg border border-percy-border bg-percy-bg-card p-2.5 transition-shadow hover:shadow-sm"
    :class="{ 'opacity-60': task.status === 'done' }"
    :data-testid="`task-item-${task.id}`"
  >
    <!-- Color accent strip -->
    <div class="w-1 shrink-0 self-stretch rounded-full" :style="{ backgroundColor: accentColor }" />

    <!-- Checkbox area -->
    <button
      class="mt-0.5 shrink-0 text-lg leading-none"
      :title="task.status === 'done' ? 'Marquer comme à faire' : 'Marquer comme fait'"
      @click.stop="emit('toggle', task.id)"
    >
      {{ statusIcons[task.status] }}
    </button>

    <!-- Content -->
    <div class="min-w-0 flex-1">
      <div class="flex items-start justify-between gap-2">
        <p
          class="text-sm font-semibold text-percy-text-primary"
          :class="{ 'line-through': task.status === 'done' }"
        >
          {{ task.title }}
        </p>
        <div class="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            class="rounded p-1 text-percy-text-muted hover:bg-percy-bg-nav hover:text-percy-primary"
            title="Modifier"
            @click.stop="emit('edit', task.id)"
          >
            <Pencil class="h-3.5 w-3.5" />
          </button>
          <button
            class="rounded p-1 text-percy-text-muted hover:bg-percy-danger-light hover:text-percy-danger"
            title="Supprimer"
            @click.stop="emit('delete', task.id)"
          >
            <Trash2 class="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <!-- Meta line -->
      <div class="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-percy-text-muted">
        <span v-if="task.assignee">{{ task.assignee.avatar ?? '👤' }} {{ task.assignee.name }}</span>
        <span v-else>Libre</span>
        <span :class="priorityColors[task.priority]" class="rounded-sm px-1.5 py-0.5 text-[11px] font-bold">
          {{ priorityLabels[task.priority] }}
        </span>
        <span v-if="task.dueDate">📅 {{ formatDate(task.dueDate) }}</span>
      </div>

      <!-- Subtasks toggle -->
      <button
        v-if="hasSubtasks"
        class="mt-1.5 flex items-center gap-1 text-xs text-percy-text-muted hover:text-percy-primary"
        @click.stop="expanded = !expanded"
      >
        <component :is="expanded ? ChevronDown : ChevronRight" class="h-3 w-3" />
        {{ completedSubtasks }}/{{ task.subtasks.length }} sous-tâches
      </button>

      <!-- Subtask list -->
      <div v-if="expanded && hasSubtasks" class="mt-1.5 space-y-1 border-l-2 border-percy-border pl-3">
        <div
          v-for="sub in task.subtasks"
          :key="sub.id"
          class="flex cursor-pointer items-center gap-2 text-xs"
          :class="sub.completed ? 'text-percy-text-muted line-through' : 'text-percy-text-secondary'"
          @click.stop="emit('toggle-subtask', task.id, sub.id)"
        >
          <span>{{ sub.completed ? '☑' : '☐' }}</span>
          <span>{{ sub.title }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
