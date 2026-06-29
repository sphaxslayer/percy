/**
 * Unit tests for the meal-slots composable.
 * Focus on the week navigation, slot indexing, and upsert semantics that
 * make this composable different from a plain CRUD list.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useMealSlots } from '~/composables/use-meal-slots';
import { API } from '~/lib/routes';

const mockFetch = vi.fn();
vi.stubGlobal('$fetch', mockFetch);

function isoDay(date: string): string {
  return new Date(date).toISOString();
}

const SLOT_MONDAY_LUNCH = {
  id: 'slot-1',
  date: isoDay('2026-06-29'),
  mealType: 'lunch' as const,
  recipeId: 'recipe-1',
  recipe: null,
  servings: null,
  notes: null,
  createdAt: '2026-06-29T00:00:00.000Z',
  updatedAt: '2026-06-29T00:00:00.000Z',
};

describe('useMealSlots', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('weekDays returns 7 consecutive days starting on Monday', () => {
    const { weekDays } = useMealSlots();
    expect(weekDays.value).toHaveLength(7);
    // Monday is index 0 in the (UTC day + 6) % 7 layout.
    expect((weekDays.value[0]!.getUTCDay() + 6) % 7).toBe(0);
  });

  it('fetchSlots queries the canonical endpoint with the current week range', async () => {
    mockFetch.mockResolvedValue({ data: [] });
    const { fetchSlots } = useMealSlots();

    await fetchSlots();

    const call = mockFetch.mock.calls[0];
    expect(call![0]).toBe(API.skills.mealPlanner.mealSlots);
    expect(call![1].query.from).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(call![1].query.to).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('getSlot returns the matching slot by (date, mealType)', async () => {
    mockFetch.mockResolvedValue({ data: [SLOT_MONDAY_LUNCH] });
    const { fetchSlots, getSlot } = useMealSlots();

    await fetchSlots();

    const date = new Date('2026-06-29');
    expect(getSlot(date, 'lunch')?.id).toBe('slot-1');
    expect(getSlot(date, 'dinner')).toBeNull();
  });

  it('setSlot updates the existing slot when its id is already in the list', async () => {
    mockFetch
      .mockResolvedValueOnce({ data: [SLOT_MONDAY_LUNCH] })
      .mockResolvedValueOnce({
        data: { ...SLOT_MONDAY_LUNCH, recipeId: 'recipe-2' },
      });

    const { slots, fetchSlots, setSlot } = useMealSlots();
    await fetchSlots();
    await setSlot({ date: SLOT_MONDAY_LUNCH.date, mealType: 'lunch', recipeId: 'recipe-2' });

    expect(slots.value).toHaveLength(1);
    expect(slots.value[0]!.recipeId).toBe('recipe-2');
  });

  it('setSlot appends a new slot when the id is not in the list', async () => {
    mockFetch
      .mockResolvedValueOnce({ data: [SLOT_MONDAY_LUNCH] })
      .mockResolvedValueOnce({
        data: { ...SLOT_MONDAY_LUNCH, id: 'slot-2', mealType: 'dinner' },
      });

    const { slots, fetchSlots, setSlot } = useMealSlots();
    await fetchSlots();
    await setSlot({ date: SLOT_MONDAY_LUNCH.date, mealType: 'dinner', recipeId: 'recipe-1' });

    expect(slots.value).toHaveLength(2);
  });

  it('removeSlot strips the slot from the local list', async () => {
    mockFetch
      .mockResolvedValueOnce({ data: [SLOT_MONDAY_LUNCH] })
      .mockResolvedValueOnce({ data: { deleted: true } });

    const { slots, fetchSlots, removeSlot } = useMealSlots();
    await fetchSlots();
    await removeSlot('slot-1');

    expect(slots.value).toHaveLength(0);
  });

  it('week navigation moves the anchor by 7 days', () => {
    const { weekStart, goToNextWeek, goToPreviousWeek } = useMealSlots();
    const initial = weekStart.value.getTime();

    goToNextWeek();
    expect(weekStart.value.getTime() - initial).toBe(7 * 24 * 60 * 60 * 1000);

    goToPreviousWeek();
    expect(weekStart.value.getTime()).toBe(initial);
  });
});
