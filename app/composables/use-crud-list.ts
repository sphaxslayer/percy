/**
 * app/composables/use-crud-list.ts — Generic CRUD list composable.
 *
 * Provides the standard fetch/add/update/remove operations against a REST
 * endpoint that follows Percy's API conventions:
 *   GET    {baseUrl}        → { data: T[] }
 *   POST   {baseUrl}        → { data: T }
 *   PATCH  {baseUrl}/{id}   → { data: T }
 *   DELETE {baseUrl}/{id}
 *
 * State is exposed as refs so consumers can read it reactively and add
 * skill-specific computed / helpers on top.
 */
import { ref, type Ref } from 'vue';

export interface CrudListOptions {
  /** Base URL of the REST resource, e.g. '/api/skills/grocery/items' */
  baseUrl: string;
  /** User-facing message set on `error` when `fetchAll` fails */
  fetchErrorMessage?: string;
}

export interface CrudList<T extends { id: string }, TCreateInput, TUpdateInput> {
  items: Ref<T[]>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
  fetchAll: (query?: Record<string, string>) => Promise<void>;
  add: (input: TCreateInput) => Promise<T>;
  update: (id: string, data: TUpdateInput) => Promise<T>;
  remove: (id: string) => Promise<void>;
}

export function useCrudList<T extends { id: string }, TCreateInput, TUpdateInput>(
  options: CrudListOptions,
): CrudList<T, TCreateInput, TUpdateInput> {
  const items = ref<T[]>([]) as Ref<T[]>;
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchAll(query?: Record<string, string>) {
    loading.value = true;
    error.value = null;
    try {
      const queryStr = query && Object.keys(query).length > 0
        ? '?' + new URLSearchParams(query).toString()
        : '';
      const res = await $fetch<{ data: T[] }>(`${options.baseUrl}${queryStr}`);
      items.value = res.data;
    } catch {
      error.value = options.fetchErrorMessage ?? 'Impossible de charger les données';
    } finally {
      loading.value = false;
    }
  }

  async function add(input: TCreateInput): Promise<T> {
    const res = await $fetch<{ data: T }>(options.baseUrl, {
      method: 'POST',
      body: input as Record<string, unknown>,
    });
    items.value = [...items.value, res.data];
    return res.data;
  }

  async function update(id: string, data: TUpdateInput): Promise<T> {
    const res = await $fetch<{ data: T }>(`${options.baseUrl}/${id}`, {
      method: 'PATCH',
      body: data as Record<string, unknown>,
    });
    items.value = items.value.map((item) => (item.id === id ? res.data : item));
    return res.data;
  }

  async function remove(id: string): Promise<void> {
    await $fetch(`${options.baseUrl}/${id}`, { method: 'DELETE' });
    items.value = items.value.filter((item) => item.id !== id);
  }

  return { items, loading, error, fetchAll, add, update, remove };
}
