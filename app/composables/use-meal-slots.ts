/**
 * app/composables/use-meal-slots.ts — Meal-slot list for a date range with
 * upsert semantics on (date, mealType).
 *
 * Unlike a plain CRUD list, POST is server-side upsert: the same (date, mealType)
 * pair always returns one slot. We mirror that behaviour locally by replacing
 * any existing slot with the same id, or appending otherwise.
 */
import { ref, computed } from 'vue';
import { API } from '~/lib/routes';
import { MEAL_TYPES, type MealSlot, type MealSlotInput, type MealType } from '~/types/meal-planner';

/** Returns a YYYY-MM-DD key for a Date, ignoring time of day. */
function dayKey(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
}

/** Computes the Monday of the week containing `ref` (UTC). */
function mondayOf(ref: Date): Date {
  const d = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate()));
  const offset = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - offset);
  return d;
}

export function useMealSlots() {
  const slots = ref<MealSlot[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // The week currently displayed (anchor at Monday).
  const weekStart = ref<Date>(mondayOf(new Date()));

  /** Seven consecutive Date objects starting at weekStart. */
  const weekDays = computed<Date[]>(() => {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart.value);
      d.setUTCDate(d.getUTCDate() + i);
      days.push(d);
    }
    return days;
  });

  /**
   * Two-level lookup: by date key first, then by meal type. Lets the week
   * grid render in O(1) per cell without rescanning the flat array.
   */
  const slotsByDay = computed<Map<string, Map<MealType, MealSlot>>>(() => {
    const map = new Map<string, Map<MealType, MealSlot>>();
    for (const slot of slots.value) {
      const key = dayKey(slot.date);
      let inner = map.get(key);
      if (!inner) {
        inner = new Map();
        map.set(key, inner);
      }
      inner.set(slot.mealType, slot);
    }
    return map;
  });

  function getSlot(date: Date, mealType: MealType): MealSlot | null {
    return slotsByDay.value.get(dayKey(date))?.get(mealType) ?? null;
  }

  async function fetchSlots(from?: Date, to?: Date) {
    loading.value = true;
    error.value = null;
    try {
      const fromKey = dayKey(from ?? weekDays.value[0]!);
      const toKey = dayKey(to ?? weekDays.value[6]!);
      const res = await $fetch<{ data: MealSlot[] }>(API.skills.mealPlanner.mealSlots, {
        query: { from: fromKey, to: toKey },
      });
      slots.value = res.data;
    } catch {
      error.value = 'Impossible de charger le planning';
    } finally {
      loading.value = false;
    }
  }

  /** Upsert a slot — POST handles both create and update server-side. */
  async function setSlot(input: MealSlotInput): Promise<MealSlot> {
    const res = await $fetch<{ data: MealSlot }>(API.skills.mealPlanner.mealSlots, {
      method: 'POST',
      body: input,
    });
    const existingIndex = slots.value.findIndex((s) => s.id === res.data.id);
    if (existingIndex >= 0) {
      slots.value = slots.value.map((s, i) => (i === existingIndex ? res.data : s));
    } else {
      slots.value = [...slots.value, res.data];
    }
    return res.data;
  }

  async function removeSlot(id: string): Promise<void> {
    await $fetch(`${API.skills.mealPlanner.mealSlots}/${id}`, { method: 'DELETE' });
    slots.value = slots.value.filter((s) => s.id !== id);
  }

  // ─── Week navigation helpers ────────────────────────────────────────
  function goToPreviousWeek() {
    const d = new Date(weekStart.value);
    d.setUTCDate(d.getUTCDate() - 7);
    weekStart.value = d;
  }

  function goToNextWeek() {
    const d = new Date(weekStart.value);
    d.setUTCDate(d.getUTCDate() + 7);
    weekStart.value = d;
  }

  function goToCurrentWeek() {
    weekStart.value = mondayOf(new Date());
  }

  /** Total number of slots in the currently loaded list — used by dashboards. */
  const slotCount = computed(() => slots.value.length);

  return {
    slots,
    loading,
    error,
    weekStart,
    weekDays,
    slotsByDay,
    slotCount,
    mealTypes: MEAL_TYPES,
    getSlot,
    fetchSlots,
    setSlot,
    removeSlot,
    goToPreviousWeek,
    goToNextWeek,
    goToCurrentWeek,
  };
}
