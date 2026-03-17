/**
 * Unit tests for the grocery list composable.
 * Tests CRUD operations, computed properties, and optimistic updates.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useGroceryList } from '~/composables/use-grocery-list';

// Mock $fetch
const mockFetch = vi.fn();
vi.stubGlobal('$fetch', mockFetch);

// Mock crypto.randomUUID
vi.stubGlobal('crypto', { randomUUID: () => 'test-uuid' });

// Mock localStorage
const store: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => {
    store[key] = value;
  },
  removeItem: (key: string) => {
    store[key] = undefined as never;
  },
});

// Mock navigator.onLine
Object.defineProperty(globalThis, 'navigator', {
  value: { onLine: true },
  writable: true,
});

// Stub Vue lifecycle hooks
vi.mock('vue', async () => {
  const actual = await vi.importActual('vue');
  return {
    ...(actual as Record<string, unknown>),
    onMounted: vi.fn(),
    onUnmounted: vi.fn(),
  };
});

const TEST_ITEM = {
  id: 'item-1',
  name: 'Lait',
  quantity: 2,
  unit: 'L',
  categoryId: 'cat-1',
  category: { id: 'cat-1', name: 'Produits laitiers', sortOrder: 1 },
  checked: false,
  checkedAt: null,
  sortOrder: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('useGroceryList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const k of Object.keys(store)) store[k] = undefined as never;
  });

  describe('fetchItems', () => {
    it('loads items from API', async () => {
      mockFetch.mockResolvedValueOnce({ data: [TEST_ITEM] });

      const { fetchItems, items, loading } = useGroceryList();
      expect(loading.value).toBe(false);

      await fetchItems();

      expect(items.value).toEqual([TEST_ITEM]);
      expect(loading.value).toBe(false);
    });

    it('sets error on failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { fetchItems, error } = useGroceryList();
      await fetchItems();

      expect(error.value).toBe('Impossible de charger la liste');
    });
  });

  describe('computed properties', () => {
    it('separates active and checked items', () => {
      const { items, activeItems, checkedItems, activeCount, checkedCount } = useGroceryList();

      items.value = [
        { ...TEST_ITEM, id: '1', checked: false },
        { ...TEST_ITEM, id: '2', checked: true },
        { ...TEST_ITEM, id: '3', checked: false },
      ];

      expect(activeCount.value).toBe(2);
      expect(checkedCount.value).toBe(1);
      expect(activeItems.value.map((i) => i.id)).toEqual(['1', '3']);
      expect(checkedItems.value.map((i) => i.id)).toEqual(['2']);
    });

    it('groups items by category', () => {
      const { items, categories, itemsByCategory } = useGroceryList();

      categories.value = [
        { id: 'cat-1', name: 'Fruits', sortOrder: 0 },
        { id: 'cat-2', name: 'Laitier', sortOrder: 1 },
      ];

      items.value = [
        { ...TEST_ITEM, id: '1', categoryId: 'cat-1', checked: false },
        { ...TEST_ITEM, id: '2', categoryId: 'cat-2', checked: false },
        { ...TEST_ITEM, id: '3', categoryId: null, category: null, checked: false },
      ];

      const groups = itemsByCategory.value;
      expect(groups).toHaveLength(3);
      // Sorted: cat-1 (sortOrder 0), cat-2 (sortOrder 1), null (last)
      expect(groups[0]!.category?.id).toBe('cat-1');
      expect(groups[1]!.category?.id).toBe('cat-2');
      expect(groups[2]!.category).toBeNull();
    });

    it('returns lastAddedName from most recent item', () => {
      const { items, lastAddedName } = useGroceryList();

      items.value = [
        { ...TEST_ITEM, id: '1', name: 'Lait', createdAt: '2026-01-01T00:00:00Z' },
        { ...TEST_ITEM, id: '2', name: 'Pain', createdAt: '2026-01-02T00:00:00Z' },
      ];

      expect(lastAddedName.value).toBe('Pain');
    });
  });

  describe('addItem', () => {
    it('adds optimistic item immediately', () => {
      mockFetch.mockImplementation(() => new Promise(() => {}));

      const { addItem, items } = useGroceryList();
      addItem({ name: 'Beurre', quantity: 1 });

      expect(items.value).toHaveLength(1);
      expect(items.value[0]!.name).toBe('Beurre');
      expect(items.value[0]!.id).toMatch(/^temp-/);
    });
  });

  describe('toggleItem', () => {
    it('toggles checked state optimistically', () => {
      mockFetch.mockImplementation(() => new Promise(() => {}));

      const { items, toggleItem } = useGroceryList();
      items.value = [{ ...TEST_ITEM, checked: false }];

      toggleItem(TEST_ITEM.id);

      expect(items.value[0]!.checked).toBe(true);
      expect(items.value[0]!.checkedAt).toBeTruthy();
    });

    it('clears checkedAt when unchecking', () => {
      mockFetch.mockImplementation(() => new Promise(() => {}));

      const { items, toggleItem } = useGroceryList();
      items.value = [{ ...TEST_ITEM, checked: true, checkedAt: '2026-01-01T00:00:00Z' }];

      toggleItem(TEST_ITEM.id);

      expect(items.value[0]!.checked).toBe(false);
      expect(items.value[0]!.checkedAt).toBeNull();
    });
  });

  describe('removeItem', () => {
    it('removes item optimistically', () => {
      mockFetch.mockImplementation(() => new Promise(() => {}));

      const { items, removeItem } = useGroceryList();
      items.value = [TEST_ITEM];

      removeItem(TEST_ITEM.id);

      expect(items.value).toHaveLength(0);
    });
  });

  describe('clearChecked', () => {
    it('removes all checked items optimistically', () => {
      mockFetch.mockImplementation(() => new Promise(() => {}));

      const { items, clearChecked } = useGroceryList();
      items.value = [
        { ...TEST_ITEM, id: '1', checked: false },
        { ...TEST_ITEM, id: '2', checked: true },
        { ...TEST_ITEM, id: '3', checked: true },
      ];

      clearChecked();

      expect(items.value).toHaveLength(1);
      expect(items.value[0]!.id).toBe('1');
    });
  });
});
