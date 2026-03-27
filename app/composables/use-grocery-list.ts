/**
 * app/composables/use-grocery-list.ts — Core composable for the Grocery List skill.
 *
 * Manages the list of grocery items with optimistic updates.
 * All mutations are applied locally first, then synced via the offline queue.
 */
import { ref, computed } from 'vue';
import { useOfflineQueue } from './use-offline-queue';
import type {
  GroceryItem,
  GroceryItemInput,
  GroceryItemGroup,
  GroceryCategory,
} from '~/types/grocery';

const API_BASE = '/api/skills/grocery';

export function useGroceryList() {
  const items = ref<GroceryItem[]>([]);
  const categories = ref<GroceryCategory[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const queue = useOfflineQueue('grocery');

  // ─── Computed ───────────────────────────────────────────────────────
  const activeItems = computed(() => items.value.filter((i) => !i.checked));

  const checkedItems = computed(() => items.value.filter((i) => i.checked));

  const activeCount = computed(() => activeItems.value.length);
  const checkedCount = computed(() => checkedItems.value.length);

  /** Group active items by category. Uncategorized items go under null key. */
  const itemsByCategory = computed<GroceryItemGroup[]>(() => {
    const groups = new Map<string | null, GroceryItem[]>();

    for (const item of activeItems.value) {
      const key = item.categoryId;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    }

    // Build result with category metadata, sorted by category sortOrder
    const result: GroceryItemGroup[] = [];
    for (const [categoryId, groupItems] of groups) {
      const category = categoryId
        ? (categories.value.find((c) => c.id === categoryId) ?? null)
        : null;
      result.push({ category, items: groupItems });
    }

    // Sort: categories by sortOrder, uncategorized last
    return result.sort((a, b) => {
      if (!a.category) return 1;
      if (!b.category) return -1;
      return a.category.sortOrder - b.category.sortOrder;
    });
  });

  /** Last added item name (for dashboard card) */
  const lastAddedName = computed(() => {
    if (items.value.length === 0) return null;
    const sorted = [...items.value].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return sorted[0]?.name ?? null;
  });

  // ─── Fetch ──────────────────────────────────────────────────────────
  async function fetchItems() {
    loading.value = true;
    error.value = null;
    try {
      const res = await $fetch<{ data: GroceryItem[] }>(`${API_BASE}/items`);
      items.value = res.data;
    } catch {
      error.value = 'Impossible de charger la liste';
    } finally {
      loading.value = false;
    }
  }

  async function fetchCategories() {
    try {
      const res = await $fetch<{ data: GroceryCategory[] }>(`${API_BASE}/categories`);
      categories.value = res.data;
    } catch {
      // Silently fail — categories are optional
    }
  }

  // ─── Mutations (optimistic + queued) ────────────────────────────────
  function addItem(input: GroceryItemInput) {
    // Generate a temporary ID for the optimistic item
    const tempId = `temp-${crypto.randomUUID()}`;
    const category = input.categoryId
      ? (categories.value.find((c) => c.id === input.categoryId) ?? null)
      : null;

    const optimisticItem: GroceryItem = {
      id: tempId,
      name: input.name,
      quantity: input.quantity ?? 1,
      unit: input.unit ?? null,
      categoryId: input.categoryId ?? null,
      category,
      checked: false,
      checkedAt: null,
      sortOrder: 0,
      createdAt: new Date().toISOString(),
    };

    items.value = [optimisticItem, ...items.value];

    queue.enqueue(
      {
        entityKey: `item:${tempId}`,
        type: 'create',
        endpoint: `${API_BASE}/items`,
        method: 'POST',
        body: {
          name: input.name,
          quantity: input.quantity ?? 1,
          unit: input.unit,
          categoryId: input.categoryId,
        },
      },
      // Rollback: remove the optimistic item
      () => {
        items.value = items.value.filter((i) => i.id !== tempId);
      },
      // On success: replace temp ID with the real ID from the server
      (response: { data: { id: string } }) => {
        const item = items.value.find((i) => i.id === tempId);
        if (item) {
          item.id = response.data.id;
        }
      },
    );
  }

  function toggleItem(id: string) {
    const item = items.value.find((i) => i.id === id);
    if (!item) return;

    const newChecked = !item.checked;
    // Optimistic update
    item.checked = newChecked;
    item.checkedAt = newChecked ? new Date().toISOString() : null;

    queue.enqueue(
      {
        entityKey: `item:${id}`,
        type: 'update',
        endpoint: `${API_BASE}/items/${id}`,
        method: 'PATCH',
        body: { checked: newChecked },
      },
      () => {
        // Rollback
        item.checked = !newChecked;
        item.checkedAt = newChecked ? null : new Date().toISOString();
      },
    );
  }

  function updateItem(
    id: string,
    data: Partial<Pick<GroceryItem, 'name' | 'quantity' | 'unit' | 'categoryId'>>,
  ) {
    const item = items.value.find((i) => i.id === id);
    if (!item) return;

    const previous = { ...item };
    Object.assign(item, data);

    queue.enqueue(
      {
        entityKey: `item:${id}`,
        type: 'update',
        endpoint: `${API_BASE}/items/${id}`,
        method: 'PATCH',
        body: data,
      },
      () => {
        Object.assign(item, previous);
      },
    );
  }

  function removeItem(id: string) {
    const index = items.value.findIndex((i) => i.id === id);
    if (index === -1) return;

    const removed = items.value[index]!;
    items.value = items.value.filter((i) => i.id !== id);

    queue.enqueue(
      {
        entityKey: `item:${id}`,
        type: 'delete',
        endpoint: `${API_BASE}/items/${id}`,
        method: 'DELETE',
      },
      () => {
        items.value.splice(index, 0, removed);
      },
    );
  }

  function clearChecked() {
    const removed = checkedItems.value;
    items.value = items.value.filter((i) => !i.checked);

    queue.enqueue(
      {
        entityKey: 'items:checked',
        type: 'delete',
        endpoint: `${API_BASE}/items/checked`,
        method: 'DELETE',
      },
      () => {
        items.value = [...items.value, ...removed];
      },
    );
  }

  async function reorderItems(updates: Array<{ id: string; sortOrder: number }>) {
    // Optimistic update — apply new sortOrders locally immediately
    const sortMap = new Map(updates.map((u) => [u.id, u.sortOrder]));
    items.value = items.value.map((i) =>
      sortMap.has(i.id) ? { ...i, sortOrder: sortMap.get(i.id)! } : i,
    );

    await $fetch(`${API_BASE}/items-reorder`, { method: 'PATCH', body: { items: updates } });
  }

  return {
    // State
    items,
    categories,
    loading,
    error,
    // Computed
    activeItems,
    checkedItems,
    activeCount,
    checkedCount,
    itemsByCategory,
    lastAddedName,
    // Queue state
    pendingSync: queue.hasPending,
    isOnline: queue.isOnline,
    // Actions
    fetchItems,
    fetchCategories,
    addItem,
    toggleItem,
    updateItem,
    removeItem,
    clearChecked,
    reorderItems,
  };
}
