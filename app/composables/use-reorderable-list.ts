/**
 * app/composables/use-reorderable-list.ts — Generic reorder helper.
 *
 * Applies a new sortOrder optimistically to the local items, then PATCHes
 * the change to the server in a single bulk request. The endpoint contract
 * is: PATCH {endpoint} with body { items: Array<{ id, sortOrder }> }.
 *
 * Server-side reorder endpoints follow the same shape across skills, so any
 * composable that owns a list of records with `sortOrder` can plug this in.
 */
import type { Ref } from 'vue';

export interface ReorderUpdate {
  id: string;
  sortOrder: number;
}

export function useReorderableList<T extends { id: string; sortOrder: number }>(
  items: Ref<T[]>,
  endpoint: string,
) {
  async function reorder(updates: ReorderUpdate[]): Promise<void> {
    const sortMap = new Map(updates.map((u) => [u.id, u.sortOrder]));
    items.value = items.value.map((item) =>
      sortMap.has(item.id) ? { ...item, sortOrder: sortMap.get(item.id)! } : item,
    );
    await $fetch(endpoint, { method: 'PATCH', body: { items: updates } });
  }

  return { reorder };
}
