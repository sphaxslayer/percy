<!--
  week-planner.vue — Weekly grid (days × meal types) showing assigned recipes.
  Each cell either renders the recipe name or shows "+ Ajouter" to assign one.
-->
<script setup lang="ts">
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-vue-next';
import { MEAL_TYPE_LABELS, type MealSlot, type MealType, type Recipe } from '~/types/meal-planner';

const props = defineProps<{
  weekDays: Date[];
  mealTypes: readonly MealType[];
  getSlot: (date: Date, mealType: MealType) => MealSlot | null;
  recipes: Recipe[];
}>();

const emit = defineEmits<{
  previousWeek: [];
  nextWeek: [];
  currentWeek: [];
  assign: [payload: { date: Date; mealType: MealType; recipeId: string }];
  clear: [slot: MealSlot];
}>();

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function dayLabel(d: Date): string {
  const idx = (d.getUTCDay() + 6) % 7;
  return DAY_LABELS[idx]!;
}

function dayNumber(d: Date): number {
  return d.getUTCDate();
}

// Per-cell open state for the inline recipe picker dropdown.
const openCellKey = ref<string | null>(null);

function cellKey(d: Date, mealType: MealType): string {
  return `${d.toISOString().slice(0, 10)}_${mealType}`;
}

function handleAssign(date: Date, mealType: MealType, recipeId: string) {
  emit('assign', { date, mealType, recipeId });
  openCellKey.value = null;
}

const rangeLabel = computed(() => {
  if (props.weekDays.length === 0) return '';
  const first = props.weekDays[0]!;
  const last = props.weekDays[6]!;
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  const fmt = new Intl.DateTimeFormat('fr-FR', opts);
  return `${fmt.format(first)} → ${fmt.format(last)}`;
});
</script>

<template>
  <div class="space-y-3">
    <!-- Navigation bar -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-1">
        <button
          class="rounded-md p-2 text-percy-text-secondary hover:bg-percy-bg-nav"
          aria-label="Semaine précédente"
          data-testid="week-previous"
          @click="emit('previousWeek')"
        >
          <ChevronLeft class="h-4 w-4" />
        </button>
        <button
          class="rounded-md p-2 text-percy-text-secondary hover:bg-percy-bg-nav"
          aria-label="Semaine suivante"
          data-testid="week-next"
          @click="emit('nextWeek')"
        >
          <ChevronRight class="h-4 w-4" />
        </button>
        <button
          class="ml-2 rounded-md px-3 py-1.5 text-xs text-percy-text-secondary hover:bg-percy-bg-nav"
          data-testid="week-current"
          @click="emit('currentWeek')"
        >
          Cette semaine
        </button>
      </div>
      <span class="text-sm font-medium text-percy-text-primary">{{ rangeLabel }}</span>
    </div>

    <!-- Grid: header row (days) + one row per meal type -->
    <div
      class="grid gap-1 rounded-lg border border-percy-border bg-percy-bg-card p-2"
      style="grid-template-columns: 110px repeat(7, minmax(0, 1fr))"
    >
      <div />
      <div
        v-for="d in weekDays"
        :key="d.toISOString()"
        class="px-2 py-1 text-center text-xs font-medium text-percy-text-secondary"
      >
        {{ dayLabel(d) }} {{ dayNumber(d) }}
      </div>

      <template v-for="mealType in mealTypes" :key="mealType">
        <div class="flex items-center px-2 py-2 text-xs font-medium text-percy-text-secondary">
          {{ MEAL_TYPE_LABELS[mealType] }}
        </div>
        <div
          v-for="d in weekDays"
          :key="cellKey(d, mealType)"
          class="relative min-h-[56px] rounded-md border border-dashed border-percy-border bg-percy-bg-nav/40 p-1.5 text-xs"
          :data-testid="`cell-${cellKey(d, mealType)}`"
        >
          <!-- Filled slot -->
          <div
            v-if="getSlot(d, mealType)"
            class="flex h-full items-center justify-between gap-1"
          >
            <span class="line-clamp-2 text-percy-text-primary">
              {{ getSlot(d, mealType)?.recipe?.name ?? '—' }}
            </span>
            <button
              class="rounded p-0.5 text-percy-text-muted hover:bg-percy-bg-card"
              aria-label="Retirer ce repas"
              @click="emit('clear', getSlot(d, mealType)!)"
            >
              <X class="h-3 w-3" />
            </button>
          </div>

          <!-- Empty slot: trigger or picker -->
          <template v-else>
            <button
              v-if="openCellKey !== cellKey(d, mealType)"
              class="flex h-full w-full items-center justify-center gap-1 rounded text-percy-text-muted hover:bg-percy-bg-card"
              :data-testid="`assign-${cellKey(d, mealType)}`"
              @click="openCellKey = cellKey(d, mealType)"
            >
              <Plus class="h-3 w-3" />
            </button>
            <div
              v-else
              class="absolute inset-x-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-md border border-percy-border bg-percy-bg-card p-1 shadow-lg"
            >
              <button
                v-for="r in recipes"
                :key="r.id"
                class="block w-full truncate rounded px-2 py-1 text-left text-percy-text-primary hover:bg-percy-bg-nav"
                @click="handleAssign(d, mealType, r.id)"
              >
                {{ r.name }}
              </button>
              <button
                v-if="recipes.length === 0"
                class="block w-full px-2 py-1 text-left text-percy-text-muted"
                disabled
              >
                Aucune recette
              </button>
              <button
                class="block w-full rounded px-2 py-1 text-left text-percy-text-muted hover:bg-percy-bg-nav"
                @click="openCellKey = null"
              >
                Annuler
              </button>
            </div>
          </template>
        </div>
      </template>
    </div>
  </div>
</template>
