<!--
  TodoContextDetail.vue — Detail view of a single context.
  Shows tasks grouped by status (todo, in_progress, done).
-->
<script setup lang="ts">
import { ArrowLeft, Plus } from 'lucide-vue-next';
import type { TodoContext, TodoTask, ColorMode } from '~/types/todo';

const props = defineProps<{
  context: TodoContext;
  tasks: TodoTask[];
  colorMode?: ColorMode;
}>();

const emit = defineEmits<{
  back: [];
  'add-task': [];
  'toggle-task': [taskId: string];
  'edit-task': [taskId: string];
  'delete-task': [taskId: string];
  'toggle-subtask': [taskId: string, subtaskId: string];
}>();

const todoTasks = computed(() => props.tasks.filter((t) => t.status === 'todo'));
const inProgressTasks = computed(() => props.tasks.filter((t) => t.status === 'in_progress'));
const doneTasks = computed(() => props.tasks.filter((t) => t.status === 'done'));
</script>

<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <button
          class="rounded-md p-1.5 text-percy-text-muted hover:bg-percy-bg-nav hover:text-percy-primary"
          @click="emit('back')"
        >
          <ArrowLeft class="h-5 w-5" />
        </button>
        <h2 class="text-lg font-bold text-percy-text-primary">
          {{ context.icon }} {{ context.name }}
        </h2>
      </div>
      <button
        class="flex items-center gap-1 rounded-md bg-percy-primary px-3 py-1.5 text-xs font-bold text-percy-primary-text transition-colors hover:bg-percy-primary-hover"
        @click="emit('add-task')"
      >
        <Plus class="h-3.5 w-3.5" />
        Ajouter
      </button>
    </div>

    <!-- Todo section -->
    <section v-if="todoTasks.length > 0">
      <h3 class="mb-2 text-xs font-bold uppercase tracking-wide text-percy-text-muted">
        À faire ({{ todoTasks.length }})
      </h3>
      <div class="space-y-2">
        <TodoTaskItem
          v-for="task in todoTasks"
          :key="task.id"
          :task="task"
          :color-mode="colorMode"
          @toggle="emit('toggle-task', $event)"
          @edit="emit('edit-task', $event)"
          @delete="emit('delete-task', $event)"
          @toggle-subtask="(tId, sId) => emit('toggle-subtask', tId, sId)"
        />
      </div>
    </section>

    <!-- In progress section -->
    <section v-if="inProgressTasks.length > 0">
      <h3 class="mb-2 text-xs font-bold uppercase tracking-wide text-percy-text-muted">
        En cours ({{ inProgressTasks.length }})
      </h3>
      <div class="space-y-2">
        <TodoTaskItem
          v-for="task in inProgressTasks"
          :key="task.id"
          :task="task"
          :color-mode="colorMode"
          @toggle="emit('toggle-task', $event)"
          @edit="emit('edit-task', $event)"
          @delete="emit('delete-task', $event)"
          @toggle-subtask="(tId, sId) => emit('toggle-subtask', tId, sId)"
        />
      </div>
    </section>

    <!-- Done section -->
    <section v-if="doneTasks.length > 0">
      <h3 class="mb-2 text-xs font-bold uppercase tracking-wide text-percy-text-muted">
        Fait ({{ doneTasks.length }})
      </h3>
      <div class="space-y-2">
        <TodoTaskItem
          v-for="task in doneTasks"
          :key="task.id"
          :task="task"
          :color-mode="colorMode"
          @toggle="emit('toggle-task', $event)"
          @edit="emit('edit-task', $event)"
          @delete="emit('delete-task', $event)"
          @toggle-subtask="(tId, sId) => emit('toggle-subtask', tId, sId)"
        />
      </div>
    </section>

    <!-- Empty state -->
    <div v-if="tasks.length === 0" class="py-12 text-center">
      <p class="text-sm text-percy-text-muted">Aucune tâche dans ce contexte</p>
      <button
        class="mt-2 text-sm font-semibold text-percy-primary hover:underline"
        @click="emit('add-task')"
      >
        Créer la première
      </button>
    </div>
  </div>
</template>
