/**
 * app/composables/use-todo-tasks.ts — CRUD composable for todo tasks.
 * Wraps useCrudList for the basic CRUD and layers task-specific concerns
 * on top: subtasks, status helpers, and client-side filtering / sorting.
 */
import { ref, computed } from 'vue';
import { useCrudList } from './use-crud-list';
import { API } from '~/lib/routes';
import type { TodoTask, TodoTaskInput, TodoTaskFilters, TodoSubtask } from '~/types/todo';

const API_BASE = API.skills.todoAtHome.tasks;

export function useTodoTasks() {
  const crud = useCrudList<TodoTask, TodoTaskInput, Partial<TodoTaskInput>>({
    baseUrl: API_BASE,
    fetchErrorMessage: 'Impossible de charger les tâches',
  });

  const filters = ref<TodoTaskFilters>({});

  // ─── Computed views ─────────────────────────────────────────────────
  const openTasks = computed(() => crud.items.value.filter((t) => t.status !== 'done'));
  const doneTasks = computed(() => crud.items.value.filter((t) => t.status === 'done'));
  const urgentTasks = computed(() =>
    crud.items.value.filter((t) => t.priority === 'high' && t.status !== 'done'),
  );

  const tasksByStatus = computed(() => ({
    todo: crud.items.value.filter((t) => t.status === 'todo'),
    in_progress: crud.items.value.filter((t) => t.status === 'in_progress'),
    done: crud.items.value.filter((t) => t.status === 'done'),
  }));

  const openCount = computed(() => openTasks.value.length);
  const urgentCount = computed(() => urgentTasks.value.length);

  /**
   * Client-side filtered + sorted view of tasks. All filter/sort logic
   * runs here so the search input never re-fetches or loses focus.
   */
  const filteredTasks = computed(() => {
    const { search, contextId, status, priority, assigneeId, sort } = filters.value;
    let result = crud.items.value;

    if (search) {
      const q = search.toLowerCase();
      // Match task title OR the context name it belongs to.
      result = result.filter(
        (t) => t.title.toLowerCase().includes(q) || t.context.name.toLowerCase().includes(q),
      );
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

    // Sort on top of whatever order the API returned.
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
    // 'createdAt' (default): API already returns newest-first, no re-sort needed.

    return result;
  });

  /**
   * True when any search or filter chip is active (sort alone does not count).
   * The page uses this to switch from the card grid to a flat task list.
   */
  const hasActiveFilters = computed(() => {
    const { search, status, priority, contextId, assigneeId } = filters.value;
    return !!(search || status || priority || contextId || assigneeId);
  });

  // ─── Status helpers ────────────────────────────────────────────────
  async function toggleTaskDone(id: string) {
    const task = crud.items.value.find((t) => t.id === id);
    if (!task) return;
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    return crud.update(id, { status: newStatus });
  }

  async function setTaskStatus(id: string, status: TodoTask['status']) {
    return crud.update(id, { status });
  }

  // ─── Subtasks ───────────────────────────────────────────────────────
  async function addSubtask(taskId: string, title: string) {
    const res = await $fetch<{ data: TodoSubtask }>(`${API_BASE}/${taskId}/subtasks`, {
      method: 'POST',
      body: { title },
    });
    const task = crud.items.value.find((t) => t.id === taskId);
    if (task) {
      task.subtasks = [...task.subtasks, res.data];
    }
    return res.data;
  }

  async function toggleSubtask(taskId: string, subtaskId: string) {
    const task = crud.items.value.find((t) => t.id === taskId);
    const subtask = task?.subtasks.find((s) => s.id === subtaskId);
    if (!task || !subtask) return;

    const res = await $fetch<{ data: TodoSubtask }>(
      `${API_BASE}/${taskId}/subtasks/${subtaskId}`,
      { method: 'PATCH', body: { completed: !subtask.completed } },
    );
    task.subtasks = task.subtasks.map((s) => (s.id === subtaskId ? res.data : s));
    return res.data;
  }

  async function removeSubtask(taskId: string, subtaskId: string) {
    await $fetch(`${API_BASE}/${taskId}/subtasks/${subtaskId}`, { method: 'DELETE' });
    const task = crud.items.value.find((t) => t.id === taskId);
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
    tasks: crud.items,
    loading: crud.loading,
    error: crud.error,
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
    // CRUD (delegated to useCrudList)
    fetchTasks: crud.fetchAll,
    addTask: crud.add,
    updateTask: crud.update,
    removeTask: crud.remove,
    // Status helpers
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
