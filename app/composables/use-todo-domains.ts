/**
 * app/composables/use-todo-domains.ts — CRUD composable for todo domains.
 */
import { ref } from 'vue';
import type { TodoDomain } from '~/types/todo';

const API_BASE = '/api/skills/todo-at-home/domains';

export function useTodoDomains() {
  const domains = ref<TodoDomain[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchDomains() {
    loading.value = true;
    error.value = null;
    try {
      const res = await $fetch<{ data: TodoDomain[] }>(API_BASE);
      domains.value = res.data;
    } catch {
      error.value = 'Impossible de charger les domaines';
    } finally {
      loading.value = false;
    }
  }

  async function addDomain(input: { name: string; icon?: string; description?: string }) {
    const res = await $fetch<{ data: TodoDomain }>(API_BASE, {
      method: 'POST',
      body: input,
    });
    domains.value = [...domains.value, res.data];
    return res.data;
  }

  async function updateDomain(id: string, data: Partial<Pick<TodoDomain, 'name' | 'icon' | 'description'>>) {
    const res = await $fetch<{ data: TodoDomain }>(`${API_BASE}/${id}`, {
      method: 'PATCH',
      body: data,
    });
    domains.value = domains.value.map((d) => (d.id === id ? res.data : d));
    return res.data;
  }

  async function removeDomain(id: string) {
    await $fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
    domains.value = domains.value.filter((d) => d.id !== id);
  }

  return {
    domains,
    loading,
    error,
    fetchDomains,
    addDomain,
    updateDomain,
    removeDomain,
  };
}
