<!--
  TodoFilters.vue — Filter bar + color mode toggle.
-->
<script setup lang="ts">
import { Search, ArrowUpDown } from 'lucide-vue-next';
import type { TodoContext, HouseholdMember, TodoTaskFilters, ColorMode } from '~/types/todo';

const props = defineProps<{
  contexts: TodoContext[];
  members: HouseholdMember[];
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
</script>

<template>
  <div class="space-y-2" data-testid="todo-filters">
    <!-- Search + dropdowns + sort -->
    <div class="flex flex-wrap items-center gap-2">
      <!-- Search -->
      <div class="relative flex-1 sm:min-w-48">
        <Search class="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-percy-text-muted" />
        <input
          :value="filters.search ?? ''"
          type="text"
          placeholder="Rechercher..."
          class="w-full rounded-md border border-percy-border-input bg-percy-bg-input py-1.5 pl-8 pr-3 text-sm text-percy-text-primary placeholder:text-percy-text-muted focus:border-percy-primary focus:outline-none focus:ring-2 focus:ring-percy-primary/30"
          data-testid="todo-filter-search"
          @input="updateFilter('search', ($event.target as HTMLInputElement).value)"
        />
      </div>

      <!-- Context filter -->
      <select
        :value="filters.contextId ?? ''"
        class="rounded-md border border-percy-border-input bg-percy-bg-input px-2 py-1.5 text-xs text-percy-text-primary focus:border-percy-primary focus:outline-none focus:ring-2 focus:ring-percy-primary/30"
        data-testid="todo-filter-context"
        @change="updateFilter('contextId', ($event.target as HTMLSelectElement).value)"
      >
        <option value="">Tous les contextes</option>
        <option v-for="ctx in contexts" :key="ctx.id" :value="ctx.id">
          {{ ctx.icon }} {{ ctx.name }}
        </option>
      </select>

      <!-- Status filter -->
      <select
        :value="filters.status ?? ''"
        class="rounded-md border border-percy-border-input bg-percy-bg-input px-2 py-1.5 text-xs text-percy-text-primary focus:border-percy-primary focus:outline-none focus:ring-2 focus:ring-percy-primary/30"
        data-testid="todo-filter-status"
        @change="updateFilter('status', ($event.target as HTMLSelectElement).value)"
      >
        <option value="">Tous les statuts</option>
        <option value="todo">À faire</option>
        <option value="in_progress">En cours</option>
        <option value="done">Fait</option>
      </select>

      <!-- Priority filter -->
      <select
        :value="filters.priority ?? ''"
        class="rounded-md border border-percy-border-input bg-percy-bg-input px-2 py-1.5 text-xs text-percy-text-primary focus:border-percy-primary focus:outline-none focus:ring-2 focus:ring-percy-primary/30"
        data-testid="todo-filter-priority"
        @change="updateFilter('priority', ($event.target as HTMLSelectElement).value)"
      >
        <option value="">Toutes les priorités</option>
        <option value="low">Basse</option>
        <option value="normal">Normale</option>
        <option value="high">Haute</option>
      </select>

      <!-- Assignee filter -->
      <select
        :value="filters.assigneeId ?? ''"
        class="rounded-md border border-percy-border-input bg-percy-bg-input px-2 py-1.5 text-xs text-percy-text-primary focus:border-percy-primary focus:outline-none focus:ring-2 focus:ring-percy-primary/30"
        @change="updateFilter('assigneeId', ($event.target as HTMLSelectElement).value)"
      >
        <option value="">Tous les assignés</option>
        <option v-for="m in members" :key="m.id" :value="m.id">
          {{ m.avatar ?? '👤' }} {{ m.name }}
        </option>
      </select>

    </div>

    <!-- Color mode pills + sort + slot for extra actions -->
    <div class="flex items-center gap-2">
      <nav class="inline-flex gap-0.5 rounded-lg bg-percy-bg-nav p-0.5">
        <button
          v-for="mode in (['context', 'assignee', 'priority'] as const)"
          :key="mode"
          class="rounded-md px-3 py-1 text-xs font-bold transition-colors"
          :class="colorMode === mode
            ? 'bg-percy-primary text-percy-primary-text'
            : 'text-percy-text-muted hover:bg-percy-bg-card'"
          @click="emit('update:colorMode', mode)"
        >
          {{ { context: 'Par contexte', assignee: 'Par assigné', priority: 'Par priorité' }[mode] }}
        </button>
      </nav>

      <!-- Sort -->
      <div class="flex items-center gap-1">
        <ArrowUpDown class="h-3 w-3 text-percy-text-muted" />
        <select
          :value="filters.sort ?? 'createdAt'"
          class="rounded-md border-none bg-transparent px-1 py-1 text-xs text-percy-text-muted focus:outline-none"
          @change="updateFilter('sort', ($event.target as HTMLSelectElement).value)"
        >
          <option value="createdAt">Récent</option>
          <option value="dueDate">Échéance</option>
          <option value="priority">Priorité</option>
        </select>
      </div>

      <slot />
    </div>
  </div>
</template>
