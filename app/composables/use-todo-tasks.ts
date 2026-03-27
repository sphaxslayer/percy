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

  /**
   * Client-side filtered + sorted view of tasks.
   * All filter/sort operations happen here — no extra API calls.
   * The search input can type freely without re-fetching or losing focus.
   */
  const filteredTasks = computed(() => {
    const { search, contextId, status, priority, assigneeId, sort } = filters.value;
    let result = tasks.value;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((t) => t.title.toLowerCase().includes(q));
    }
    if (contextId) {
      result = result.filter((t) => t.contextId === contextId);
    }
    if (status) {
      result = result.filter((t) => t.status === status);
    }
    if (priority) {
      result = result.filter((t) => t.priority === priority);
    }
    if (assigneeId) {
      result = result.filter((t) => t.assigneeId === assigneeId);
    }

    // Sort on top of whatever order the API returned
    if (sort === 'dueDate') {
      result = [...result].sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1; // tasks without due date go last
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
    } else if (sort === 'priority') {
      const ORDER: Record<string, number> = { high: 0, normal: 1, low: 2 };
      result = [...result].sort(
        (a, b) => (ORDER[a.priority] ?? 1) - (ORDER[b.priority] ?? 1),
      );
    } else if (sort === 'name') {
      result = [...result].sort((a, b) => a.title.localeCompare(b.title, 'fr'));
    }
    // 'createdAt' (default): API already returns newest-first, no re-sort needed

    return result;
  });

  /**
   * True when any search or filter chip is active (not counting sort alone).
   * Used by the page to switch from card grid → flat task list.
   */
  const hasActiveFilters = computed(() => {
    const { search, status, priority, contextId, assigneeId } = filters.value;
    return !!(search || status || priority || contextId || assigneeId);
  });

  // ─── Fetch ──────────────────────────────────────────────────────────
  /**
   * Always fetches ALL tasks (no server-side filtering).
   * Filtering/sorting is done client-side via filteredTasks.
   */
  async function fetchTasks() {
    loading.value = true;
    error.value = null;
    try {
      const res = await $fetch<{ data: TodoTask[] }>(API_BASE);
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
    // Computed (filtered)
    filteredTasks,
    hasActiveFilters,
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
