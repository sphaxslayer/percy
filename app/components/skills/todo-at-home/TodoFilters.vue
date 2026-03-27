<!--
  TodoFilters.vue — Filter bar + color mode toggle.

  Layout:
    Row 1 — Search input (flex-1) · Sort dropdown · [slot: Nouveau contexte button]
    Row 2 — Color mode pills · separator · Status chips · Priority chip

  All filtering is client-side (no API call on each keystroke).
  Color mode (Par contexte / Par assigné / Par priorité) controls card color coding,
  it does NOT hide tasks — it's a display preference, not a filter.
-->
<script setup lang="ts">
import { Search, ArrowUpDown } from 'lucide-vue-next';
import type { TodoTaskFilters, ColorMode } from '~/types/todo';

const props = defineProps<{
  filters: TodoTaskFilters;
  colorMode: ColorMode;
}>();

const emit = defineEmits<{
  'update:filters': [filters: TodoTaskFilters];
  'update:colorMode': [mode: ColorMode];
}>();

function updateFilter(key: keyof TodoTaskFilters, value: string | undefined) {
  emit('update:filters', { ...props.filters, [key]: value || undefined });
}

// Toggles: clicking the active chip clears the filter; clicking another sets it
function toggleStatus(status: string) {
  updateFilter('status', props.filters.status === status ? undefined : status);
}

function togglePriority(priority: string) {
  updateFilter('priority', props.filters.priority === priority ? undefined : priority);
}

const STATUS_CHIPS = [
  { value: 'todo', label: 'À faire' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'done', label: 'Faites' },
] as const;

const COLOR_MODE_LABELS: Record<ColorMode, string> = {
  context: 'Par contexte',
  assignee: 'Par assigné',
  priority: 'Par priorité',
};
</script>

<template>
  <div class="space-y-2" data-testid="todo-filters">

    <!-- ── Row 1: Search · Sort · Slot ──────────────────────────────── -->
    <div class="flex flex-wrap items-center gap-2">

      <!-- Search (client-side, no re-fetch) -->
      <div class="relative flex-1 sm:min-w-48">
        <Search
          class="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-percy-text-muted"
        />
        <input
          :value="filters.search ?? ''"
          type="text"
          placeholder="Rechercher une tâche…"
          class="w-full rounded-md border border-percy-border-input bg-percy-bg-input py-1.5 pl-8 pr-3 text-sm text-percy-text-primary placeholder:text-percy-text-muted focus:border-percy-primary focus:outline-none focus:ring-2 focus:ring-percy-primary/30"
          data-testid="todo-filter-search"
          @input="updateFilter('search', ($event.target as HTMLInputElement).value)"
        />
      </div>

      <!-- Sort -->
      <div class="flex items-center gap-1">
        <ArrowUpDown class="h-3 w-3 shrink-0 text-percy-text-muted" />
        <select
          :value="filters.sort ?? 'createdAt'"
          class="rounded-md border-none bg-transparent px-1 py-1 text-xs text-percy-text-muted focus:outline-none"
          @change="updateFilter('sort', ($event.target as HTMLSelectElement).value)"
        >
          <option value="createdAt">Récent</option>
          <option value="name">Nom A→Z</option>
          <option value="dueDate">Échéance</option>
          <option value="priority">Priorité</option>
        </select>
      </div>

      <!-- Injected content (e.g. "Nouveau contexte" button) -->
      <slot />
    </div>

    <!-- ── Row 2: Color mode · Status chips · Urgentes chip ──────────── -->
    <div class="flex flex-wrap items-center gap-2">

      <!-- Color mode: controls card accent color, not a filter -->
      <nav class="inline-flex gap-0.5 rounded-lg bg-percy-bg-nav p-0.5">
        <button
          v-for="mode in (['context', 'assignee', 'priority'] as const)"
          :key="mode"
          class="rounded-md px-3 py-1 text-xs font-bold transition-colors"
          :class="
            colorMode === mode
              ? 'bg-percy-primary text-percy-primary-text'
              : 'text-percy-text-muted hover:bg-percy-bg-card'
          "
          @click="emit('update:colorMode', mode)"
        >
          {{ COLOR_MODE_LABELS[mode] }}
        </button>
      </nav>

      <!-- Separator -->
      <div class="h-4 w-px shrink-0 bg-percy-border" />

      <!-- Status filter chips (toggle — click again to clear) -->
      <div class="inline-flex gap-0.5 rounded-lg bg-percy-bg-nav p-0.5">
        <button
          v-for="chip in STATUS_CHIPS"
          :key="chip.value"
          class="rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
          :class="
            filters.status === chip.value
              ? 'bg-percy-primary text-percy-primary-text'
              : 'text-percy-text-muted hover:bg-percy-bg-card'
          "
          @click="toggleStatus(chip.value)"
        >
          {{ chip.label }}
        </button>
      </div>

      <!-- Urgentes chip -->
      <button
        class="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors"
        :class="
          filters.priority === 'high'
            ? 'bg-percy-danger text-white'
            : 'bg-percy-bg-nav text-percy-text-muted hover:bg-percy-bg-card'
        "
        @click="togglePriority('high')"
      >
        ⚡ Urgentes
      </button>

    </div>
  </div>
</template>
