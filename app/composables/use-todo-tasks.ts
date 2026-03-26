/**
 * app/composables/use-todo-tasks.ts — CRUD composable for todo tasks.
 * Handles filtering, status changes, and subtask management.
 */
import { ref, computed } from 'vue';
import type { TodoTask, TodoTaskInput, TodoTaskFilters, TodoSubtask } from '~/types/todo';

const API_BASE = '/api/skills/todo-at-home/tasks';

export function useTodoTasks() {
  const tasks = ref<TodoTask[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const filters = ref<TodoTaskFilters>({});

  // ─── Computed ───────────────────────────────────────────────────────
  const openTasks = computed(() => tasks.value.filter((t) => t.status !== 'done'));
  const doneTasks = computed(() => tasks.value.filter((t) => t.status === 'done'));
  const urgentTasks = computed(() => tasks.value.filter((t) => t.priority === 'high' && t.status !== 'done'));

  const tasksByStatus = computed(() => ({
    todo: tasks.value.filter((t) => t.status === 'todo'),
    in_progress: tasks.value.filter((t) => t.status === 'in_progress'),
    done: tasks.value.filter((t) => t.status === 'done'),
  }));

  const openCount = computed(() => openTasks.value.length);
  const urgentCount = computed(() => urgentTasks.value.length);

  // ─── Fetch ──────────────────────────────────────────────────────────
  async function fetchTasks(filterOverrides?: TodoTaskFilters) {
    loading.value = true;
    error.value = null;
    try {
      const activeFilters = { ...filters.value, ...filterOverrides };
      const query = new URLSearchParams();
      for (const [key, value] of Object.entries(activeFilters)) {
        if (value !== undefined && value !== '' && value !== null) {
          query.set(key, String(value));
        }
      }
      const queryStr = query.toString();
      const url = queryStr ? `${API_BASE}?${queryStr}` : API_BASE;
      const res = await $fetch<{ data: TodoTask[] }>(url);
      tasks.value = res.data;
    } catch {
      error.value = 'Impossible de charger les tâches';
    } finally {
      loading.value = false;
    }
  }

  // ─── Mutations ──────────────────────────────────────────────────────
  async function addTask(input: TodoTaskInput) {
    const res = await $fetch<{ data: TodoTask }>(API_BASE, {
      method: 'POST',
      body: input,
    });
    tasks.value = [res.data, ...tasks.value];
    return res.data;
  }

  async function updateTask(id: string, data: Partial<TodoTaskInput>) {
    const res = await $fetch<{ data: TodoTask }>(`${API_BASE}/${id}`, {
      method: 'PATCH',
      body: data,
    });
    tasks.value = tasks.value.map((t) => (t.id === id ? res.data : t));
    return res.data;
  }

  async function removeTask(id: string) {
    await $fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
    tasks.value = tasks.value.filter((t) => t.id !== id);
  }

  // ─── Status changes ────────────────────────────────────────────────
  async function toggleTaskDone(id: string) {
    const task = tasks.value.find((t) => t.id === id);
    if (!task) return;
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    return updateTask(id, { status: newStatus });
  }

  async function setTaskStatus(id: string, status: TodoTask['status']) {
    return updateTask(id, { status });
  }

  // ─── Subtasks ───────────────────────────────────────────────────────
  async function addSubtask(taskId: string, title: string) {
    const res = await $fetch<{ data: TodoSubtask }>(`${API_BASE}/${taskId}/subtasks`, {
      method: 'POST',
      body: { title },
    });
    const task = tasks.value.find((t) => t.id === taskId);
    if (task) {
      task.subtasks = [...task.subtasks, res.data];
    }
    return res.data;
  }

  async function toggleSubtask(taskId: string, subtaskId: string) {
    const task = tasks.value.find((t) => t.id === taskId);
    const subtask = task?.subtasks.find((s) => s.id === subtaskId);
    if (!task || !subtask) return;

    const res = await $fetch<{ data: TodoSubtask }>(`${API_BASE}/${taskId}/subtasks/${subtaskId}`, {
      method: 'PATCH',
      body: { completed: !subtask.completed },
    });
    task.subtasks = task.subtasks.map((s) => (s.id === subtaskId ? res.data : s));
    return res.data;
  }

  async function removeSubtask(taskId: string, subtaskId: string) {
    await $fetch(`${API_BASE}/${taskId}/subtasks/${subtaskId}`, { method: 'DELETE' });
    const task = tasks.value.find((t) => t.id === taskId);
    if (task) {
      task.subtasks = task.subtasks.filter((s) => s.id !== subtaskId);
    }
  }

  // ─── Filters ────────────────────────────────────────────────────────
  function setFilters(newFilters: TodoTaskFilters) {
    filters.value = newFilters;
  }

  function clearFilters() {
    filters.value = {};
  }

  return {
    // State
    tasks,
    loading,
    error,
    filters,
    // Computed
    openTasks,
    doneTasks,
    urgentTasks,
    tasksByStatus,
    openCount,
    urgentCount,
    // Actions
    fetchTasks,
    addTask,
    updateTask,
    removeTask,
    toggleTaskDone,
    setTaskStatus,
    // Subtasks
    addSubtask,
    toggleSubtask,
    removeSubtask,
    // Filters
    setFilters,
    clearFilters,
  };
}
