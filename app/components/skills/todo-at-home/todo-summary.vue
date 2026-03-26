<!--
  todo-summary.vue — Dashboard summary widget for the TodoAtHome skill.
  Shows open/urgent task counts and next due task.
-->
<script setup lang="ts">
import { useTodoTasks } from '~/composables/use-todo-tasks';

const { tasks, openCount, urgentCount, fetchTasks } = useTodoTasks();

const nextDueTask = computed(() => {
  const now = new Date();
  return tasks.value
    .filter((t) => t.status !== 'done' && t.dueDate)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .find((t) => new Date(t.dueDate!) >= now) ?? null;
});

function formatRelativeDate(dateStr: string) {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "aujourd'hui";
  if (diff === 1) return 'demain';
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

onMounted(() => fetchTasks());
</script>

<template>
  <div
    class="mt-3 space-y-1 border-t border-percy-border pt-3 text-xs text-percy-text-muted"
    data-testid="todo-summary"
  >
    <p v-if="openCount > 0">
      {{ openCount }} tâche{{ openCount > 1 ? 's' : '' }} ouverte{{ openCount > 1 ? 's' : '' }}
    </p>
    <p v-if="urgentCount > 0" class="font-semibold text-percy-danger">
      {{ urgentCount }} urgente{{ urgentCount > 1 ? 's' : '' }}
    </p>
    <p v-if="openCount === 0">Aucune tâche ouverte</p>
    <p v-if="nextDueTask" class="truncate">
      Prochain : {{ nextDueTask.title }} ({{ formatRelativeDate(nextDueTask.dueDate!) }})
    </p>
  </div>
</template>
