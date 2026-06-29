/**
 * app/composables/use-todo-contexts.ts — CRUD composable for todo contexts.
 * Adds skill-specific helpers on top of useCrudList: per-context task
 * progress calculation, queries by domain, and bulk reorder.
 */
import { computed } from 'vue';
import { useCrudList } from './use-crud-list';
import { useReorderableList } from './use-reorderable-list';
import type { TodoContext, TodoTask } from '~/types/todo';

type ContextCreateInput = {
  domainId: string;
  name: string;
  icon?: string;
  color?: string;
  imageUrl?: string | null;
};
type ContextUpdateInput = Partial<Pick<TodoContext, 'name' | 'icon' | 'color' | 'imageUrl'>>;

export function useTodoContexts() {
  const crud = useCrudList<TodoContext, ContextCreateInput, ContextUpdateInput>({
    baseUrl: '/api/skills/todo-at-home/contexts',
    fetchErrorMessage: 'Impossible de charger les contextes',
  });

  const { reorder } = useReorderableList(
    crud.items,
    '/api/skills/todo-at-home/contexts-reorder',
  );

  /**
   * fetchContexts accepts an optional domainId to narrow the list to a
   * single domain — passed through to the generic fetchAll as a query.
   */
  function fetchContexts(domainId?: string) {
    return crud.fetchAll(domainId ? { domainId } : undefined);
  }

  /** Compute progression for a context based on its tasks (done / total / percent). */
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

  /** Resolve the global context attached to a given domain, if any. */
  const getGlobalContext = computed(() => {
    return (domainId: string) =>
      crud.items.value.find((c) => c.domainId === domainId && c.isGlobal) ?? null;
  });

  /** All contexts belonging to a domain. */
  const getContextsByDomain = computed(() => {
    return (domainId: string) =>
      crud.items.value.filter((c) => c.domainId === domainId);
  });

  return {
    contexts: crud.items,
    loading: crud.loading,
    error: crud.error,
    fetchContexts,
    addContext: crud.add,
    updateContext: crud.update,
    removeContext: crud.remove,
    reorderContexts: reorder,
    getContextProgress,
    getGlobalContext,
    getContextsByDomain,
  };
}
