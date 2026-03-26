<!--
  TodoAgendaView.vue — Agenda view grouped by day.
-->
<script setup lang="ts">
import { AlertTriangle } from 'lucide-vue-next';
import type { TodoTask } from '~/types/todo';
import { useTodoAgenda } from '~/composables/use-todo-agenda';

const props = defineProps<{
  tasks: TodoTask[];
}>();

const { agendaDays, overdueTasks, unscheduledTasks } = useTodoAgenda(() => props.tasks);

const emit = defineEmits<{
  'toggle-task': [taskId: string];
  'edit-task': [taskId: string];
}>();

const priorityDots: Record<string, string> = {
  low: 'bg-percy-success',
  normal: 'bg-percy-warning',
  high: 'bg-percy-danger',
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}
</script>

<template>
  <div class="space-y-4" data-testid="todo-agenda">
    <!-- Overdue section -->
    <section v-if="overdueTasks.length > 0" class="rounded-lg border border-percy-danger/30 bg-percy-danger-light p-3">
      <h3 class="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-percy-danger">
        <AlertTriangle class="h-3.5 w-3.5" />
        En retard ({{ overdueTasks.length }})
      </h3>
      <div class="space-y-1.5">
        <div
          v-for="task in overdueTasks"
          :key="task.id"
          class="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-percy-bg-card/50"
          @click="emit('edit-task', task.id)"
        >
          <span class="h-2.5 w-2.5 shrink-0 rounded-full" :class="priorityDots[task.priority]" />
          <span class="flex-1 truncate text-percy-text-primary">{{ task.title }}</span>
          <span class="text-xs text-percy-text-muted">{{ task.context.icon }} {{ task.context.name }}</span>
          <span v-if="task.assignee" class="text-xs text-percy-text-muted">· {{ task.assignee.name }}</span>
        </div>
      </div>
    </section>

    <!-- Days -->
    <section v-for="day in agendaDays" :key="day.date">
      <h3 class="mb-2 text-xs font-bold uppercase tracking-wide text-percy-text-muted">
        {{ day.label }}
      </h3>
      <div class="space-y-1.5">
        <div
          v-for="task in day.tasks"
          :key="task.id"
          class="flex cursor-pointer items-center gap-2 rounded-md border border-percy-border bg-percy-bg-card px-3 py-2 text-sm transition-shadow hover:shadow-sm"
          :class="{ 'opacity-60 line-through': task.status === 'done' }"
          @click="emit('edit-task', task.id)"
        >
          <span class="h-2.5 w-2.5 shrink-0 rounded-full" :class="priorityDots[task.priority]" />
          <button
            class="shrink-0 text-base leading-none"
            @click.stop="emit('toggle-task', task.id)"
          >
            {{ task.status === 'done' ? '☑' : '☐' }}
          </button>
          <span class="flex-1 truncate text-percy-text-primary">{{ task.title }}</span>
          <span class="text-xs text-percy-text-muted">{{ task.context.icon }} {{ task.context.name }}</span>
          <span v-if="task.assignee" class="text-xs text-percy-text-muted">· {{ task.assignee.name }}</span>
          <span v-if="task.dueDate" class="text-xs text-percy-text-muted">{{ formatDate(task.dueDate) }}</span>
        </div>
      </div>
      <!-- Empty day -->
      <p v-if="day.tasks.length === 0" class="py-2 text-center text-xs text-percy-text-muted">(rien)</p>
    </section>

    <!-- Unscheduled -->
    <section v-if="unscheduledTasks.length > 0">
      <h3 class="mb-2 text-xs font-bold uppercase tracking-wide text-percy-text-muted">
        Sans échéance ({{ unscheduledTasks.length }})
      </h3>
      <div class="space-y-1.5">
        <div
          v-for="task in unscheduledTasks"
          :key="task.id"
          class="flex cursor-pointer items-center gap-2 rounded-md border border-percy-border bg-percy-bg-card px-3 py-2 text-sm transition-shadow hover:shadow-sm"
          @click="emit('edit-task', task.id)"
        >
          <span class="h-2.5 w-2.5 shrink-0 rounded-full" :class="priorityDots[task.priority]" />
          <span class="flex-1 truncate text-percy-text-primary">{{ task.title }}</span>
          <span class="text-xs text-percy-text-muted">{{ task.context.icon }} {{ task.context.name }}</span>
          <span v-if="task.assignee" class="text-xs text-percy-text-muted">· {{ task.assignee.name }}</span>
        </div>
      </div>
    </section>

    <!-- Empty agenda -->
    <div v-if="agendaDays.length === 0 && unscheduledTasks.length === 0 && overdueTasks.length === 0" class="py-12 text-center">
      <p class="text-sm text-percy-text-muted">Aucune tâche planifiée</p>
    </div>
  </div>
</template>
