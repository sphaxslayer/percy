/**
 * app/composables/use-todo-domains.ts — CRUD composable for todo domains.
 * Thin wrapper around useCrudList that exposes a skill-friendly API
 * (domains/addDomain/...) while keeping the generic behaviour underneath.
 */
import { useCrudList } from './use-crud-list';
import type { TodoDomain } from '~/types/todo';

type DomainCreateInput = { name: string; icon?: string; description?: string };
type DomainUpdateInput = Partial<Pick<TodoDomain, 'name' | 'icon' | 'description'>>;

export function useTodoDomains() {
  const crud = useCrudList<TodoDomain, DomainCreateInput, DomainUpdateInput>({
    baseUrl: '/api/skills/todo-at-home/domains',
    fetchErrorMessage: 'Impossible de charger les domaines',
  });

  return {
    domains: crud.items,
    loading: crud.loading,
    error: crud.error,
    fetchDomains: crud.fetchAll,
    addDomain: crud.add,
    updateDomain: crud.update,
    removeDomain: crud.remove,
  };
}
