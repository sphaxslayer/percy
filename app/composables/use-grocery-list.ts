/**
 * app/composables/use-grocery-list.ts — Core composable for the Grocery List skill.
 *
 * Manages the list of grocery items with optimistic updates.
 * Items, categories and most product actions are queued via the offline queue
 * so the in-store flow keeps working without network.
 */
import { ref, computed } from 'vue';
import { useOfflineQueue } from './use-offline-queue';
import { useReorderableList } from './use-reorderable-list';
import { API } from '~/lib/routes';
import type {
  GroceryItem,
  GroceryItemInput,
  GroceryItemGroup,
  GroceryCategory,
  GroceryProduct,
} from '~/types/grocery';

export function useGroceryList() {
  const items = ref<GroceryItem[]>([]);
  const categories = ref<GroceryCategory[]>([]);
  const products = ref<GroceryProduct[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const queue = useOfflineQueue('grocery');

  // ─── Computed ───────────────────────────────────────────────────────
  // Sort by sortOrder so drag-and-drop state survives the watch() reset after
  // the optimistic update. Without this, the watch would reset flatDraggableItems
  // back to insertion order, visually reverting the drag.
  const activeItems = computed(() =>
    items.value.filter((i) => !i.checked).sort((a, b) => a.sortOrder - b.sortOrder),
  );

  const checkedItems = computed(() => items.value.filter((i) => i.checked));

  const activeCount = computed(() => activeItems.value.length);
  const checkedCount = computed(() => checkedItems.value.length);

  /** Categories sorted by their sortOrder — ready for display/drag-drop. */
  const sortedCategories = computed(() =>
    [...categories.value].sort((a, b) => a.sortOrder - b.sortOrder),
  );

  /** Group active items by category. Uncategorized items go under null key. */
  const itemsByCategory = computed<GroceryItemGroup[]>(() => {
    const groups = new Map<string | null, GroceryItem[]>();

    for (const item of activeItems.value) {
      const key = item.categoryId;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    }

    const result: GroceryItemGroup[] = [];
    for (const [categoryId, groupItems] of groups) {
      const category = categoryId
        ? (categories.value.find((c) => c.id === categoryId) ?? null)
        : null;
      result.push({ category, items: groupItems });
    }

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
      const res = await $fetch<{ data: GroceryItem[] }>(API.skills.grocery.items);
      items.value = res.data;
    } catch {
      error.value = 'Impossible de charger la liste';
    } finally {
      loading.value = false;
    }
  }

  async function fetchCategories() {
    try {
      const res = await $fetch<{ data: GroceryCategory[] }>(API.skills.grocery.categories);
      categories.value = res.data;
    } catch {
      // Silently fail — categories are optional.
    }
  }

  async function fetchProducts() {
    try {
      const res = await $fetch<{ data: GroceryProduct[] }>(API.skills.grocery.products);
      products.value = res.data;
    } catch {
      // Silently fail — catalog is optional.
    }
  }

  // ─── Item mutations (optimistic + queued) ───────────────────────────
  function addItem(input: GroceryItemInput) {
    const tempId = `temp-${crypto.randomUUID()}`;
    const category = input.categoryId
      ? (categories.value.find((c) => c.id === input.categoryId) ?? null)
      : null;

    // New item goes on top of the active list while we wait for the server.
    const minOrder = items.value.reduce((min, i) => Math.min(min, i.sortOrder), 0);
    const optimisticItem: GroceryItem = {
      id: tempId,
      name: input.name,
      quantity: input.quantity ?? 1,
      unit: input.unit ?? null,
      categoryId: input.categoryId ?? null,
      category,
      checked: false,
      checkedAt: null,
      sortOrder: minOrder - 1,
      createdAt: new Date().toISOString(),
    };

    items.value = [optimisticItem, ...items.value];

    queue.enqueue(
      {
        entityKey: `item:${tempId}`,
        type: 'create',
        endpoint: API.skills.grocery.items,
        method: 'POST',
        body: {
          name: input.name,
          quantity: input.quantity ?? 1,
          unit: input.unit,
          categoryId: input.categoryId,
        },
      },
      () => {
        items.value = items.value.filter((i) => i.id !== tempId);
      },
      (response: { data: { id: string; sortOrder: number } }) => {
        const item = items.value.find((i) => i.id === tempId);
        if (item) {
          item.id = response.data.id;
          item.sortOrder = response.data.sortOrder;
        }
      },
    );
  }

  function toggleItem(id: string) {
    const item = items.value.find((i) => i.id === id);
    if (!item) return;

    const newChecked = !item.checked;
    item.checked = newChecked;
    item.checkedAt = newChecked ? new Date().toISOString() : null;

    queue.enqueue(
      {
        entityKey: `item:${id}`,
        type: 'update',
        endpoint: `${API.skills.grocery.items}/${id}`,
        method: 'PATCH',
        body: { checked: newChecked },
      },
      () => {
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
    // Keep the embedded category in sync with categoryId.
    if ('categoryId' in data) {
      item.category = data.categoryId
        ? (categories.value.find((c) => c.id === data.categoryId) ?? null)
        : null;
    }

    queue.enqueue(
      {
        entityKey: `item:${id}`,
        type: 'update',
        endpoint: `${API.skills.grocery.items}/${id}`,
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
        endpoint: `${API.skills.grocery.items}/${id}`,
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
        endpoint: API.skills.grocery.itemsChecked,
        method: 'DELETE',
      },
      () => {
        items.value = [...items.value, ...removed];
      },
    );
  }

  const { reorder: reorderItems } = useReorderableList(items, API.skills.grocery.itemsReorder);

  // ─── Category mutations (optimistic + queued) ───────────────────────
  function addCategory(name: string) {
    const tempId = `temp-cat-${crypto.randomUUID()}`;
    const maxOrder = categories.value.reduce((max, c) => Math.max(max, c.sortOrder), -1);
    const optimistic: GroceryCategory = {
      id: tempId,
      name,
      sortOrder: maxOrder + 1,
    };
    categories.value = [...categories.value, optimistic];

    queue.enqueue(
      {
        entityKey: `category:${tempId}`,
        type: 'create',
        endpoint: API.skills.grocery.categories,
        method: 'POST',
        body: { name },
      },
      () => {
        categories.value = categories.value.filter((c) => c.id !== tempId);
      },
      (response: { data: { id: string; sortOrder: number } }) => {
        const cat = categories.value.find((c) => c.id === tempId);
        if (cat) {
          cat.id = response.data.id;
          cat.sortOrder = response.data.sortOrder;
        }
      },
    );
  }

  function renameCategory(id: string, name: string) {
    const cat = categories.value.find((c) => c.id === id);
    if (!cat) return;
    const previousName = cat.name;
    cat.name = name;

    queue.enqueue(
      {
        entityKey: `category:${id}`,
        type: 'update',
        endpoint: `${API.skills.grocery.categories}/${id}`,
        method: 'PATCH',
        body: { name },
      },
      () => {
        cat.name = previousName;
      },
    );
  }

  function removeCategory(id: string) {
    const index = categories.value.findIndex((c) => c.id === id);
    if (index === -1) return;
    const removed = categories.value[index]!;

    // Server cascades onDelete: SetNull on items — mirror it locally so the
    // affected items move to the "Sans catégorie" group immediately.
    const affectedItems = items.value.filter((i) => i.categoryId === id);
    const previousCategoryIds = affectedItems.map((i) => ({ id: i.id, prev: i.categoryId }));
    for (const item of affectedItems) {
      item.categoryId = null;
      item.category = null;
    }
    categories.value = categories.value.filter((c) => c.id !== id);

    queue.enqueue(
      {
        entityKey: `category:${id}`,
        type: 'delete',
        endpoint: `${API.skills.grocery.categories}/${id}`,
        method: 'DELETE',
      },
      () => {
        categories.value.splice(index, 0, removed);
        // Restore each item's categoryId in case rollback fires.
        for (const { id: itemId, prev } of previousCategoryIds) {
          const item = items.value.find((i) => i.id === itemId);
          if (item) {
            item.categoryId = prev;
            item.category = prev
              ? (categories.value.find((c) => c.id === prev) ?? null)
              : null;
          }
        }
      },
    );
  }

  const { reorder: reorderCategories } = useReorderableList(
    categories,
    API.skills.grocery.categoriesReorder,
  );

  // ─── Product (catalog) mutations ────────────────────────────────────
  // Catalog management is a "home" task, not a critical in-store flow —
  // so it goes through plain $fetch instead of the offline queue.
  async function removeProduct(id: string) {
    products.value = products.value.filter((p) => p.id !== id);
    await $fetch(`${API.skills.grocery.products}/${id}`, { method: 'DELETE' });
  }

  return {
    // State
    items,
    categories,
    products,
    loading,
    error,
    // Computed
    activeItems,
    checkedItems,
    activeCount,
    checkedCount,
    itemsByCategory,
    sortedCategories,
    lastAddedName,
    // Queue state
    pendingSync: queue.hasPending,
    isOnline: queue.isOnline,
    // Items
    fetchItems,
    addItem,
    toggleItem,
    updateItem,
    removeItem,
    clearChecked,
    reorderItems,
    // Categories
    fetchCategories,
    addCategory,
    renameCategory,
    removeCategory,
    reorderCategories,
    // Products
    fetchProducts,
    removeProduct,
  };
}
