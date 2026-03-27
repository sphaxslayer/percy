/**
 * app/composables/use-todo-contexts.ts — CRUD composable for todo contexts.
 * Includes progression calculation based on task statuses.
 */
import { ref, computed } from 'vue';
import type { TodoContext, TodoTask } from '~/types/todo';

const API_BASE = '/api/skills/todo-at-home/contexts';

export function useTodoContexts() {
  const contexts = ref<TodoContext[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchContexts(domainId?: string) {
    loading.value = true;
    error.value = null;
    try {
      const query = domainId ? `?domainId=${domainId}` : '';
      const res = await $fetch<{ data: TodoContext[] }>(`${API_BASE}${query}`);
      contexts.value = res.data;
    } catch {
      error.value = 'Impossible de charger les contextes';
    } finally {
      loading.value = false;
    }
  }

  async function addContext(input: { domainId: string; name: string; icon?: string; color?: string; imageUrl?: string | null }) {
    const res = await $fetch<{ data: TodoContext }>(API_BASE, {
      method: 'POST',
      body: input,
    });
    contexts.value = [...contexts.value, res.data];
    return res.data;
  }

  async function updateContext(id: string, data: Partial<Pick<TodoContext, 'name' | 'icon' | 'color' | 'imageUrl'>>) {
    const res = await $fetch<{ data: TodoContext }>(`${API_BASE}/${id}`, {
      method: 'PATCH',
      body: data,
    });
    contexts.value = contexts.value.map((c) => (c.id === id ? res.data : c));
    return res.data;
  }

  async function removeContext(id: string) {
    await $fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
    contexts.value = contexts.value.filter((c) => c.id !== id);
  }

  /** Calculate progression for a context based on its tasks */
  function getContextProgress(contextId: string, tasks: TodoTask[]) {
    const contextTasks = tasks.filter((t) => t.contextId === contextId);
    if (contextTasks.length === 0) return { total: 0, done: 0, percent: 0 };

    const done = contextTasks.filter((t) => t.status === 'done').length;
    return {
      total: contextTasks.length,
      done,
      percent: Math.round((done / contextTasks.length) * 100),
    };
  }

  /** Get the global context for a domain */
  const getGlobalContext = computed(() => {
    return (domainId: string) => contexts.value.find((c) => c.domainId === domainId && c.isGlobal) ?? null;
  });

  /** Get non-global contexts for a domain */
  const getContextsByDomain = computed(() => {
    return (domainId: string) => contexts.value.filter((c) => c.domainId === domainId);
  });

  return {
    contexts,
    loading,
    error,
    fetchContexts,
    addContext,
    updateContext,
    removeContext,
    getContextProgress,
    getGlobalContext,
    getContextsByDomain,
  };
}
