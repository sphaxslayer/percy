<!--
  grocery-catalog-tab.vue — Manage the personal product catalog.
  Lists products with their category and usage count; lets the user remove
  outdated entries. Catalog management is a "home" task, not in-store, so
  network failures here are surfaced rather than queued.
-->
<script setup lang="ts">
import { computed, ref } from 'vue';
import { Trash2, Search } from 'lucide-vue-next';
import type { GroceryProduct } from '~/types/grocery';

const props = defineProps<{
  products: GroceryProduct[];
}>();

const emit = defineEmits<{
  remove: [id: string];
}>();

const search = ref('');
const sortMode = ref<'usage' | 'name'>('usage');

const filteredProducts = computed(() => {
  const query = search.value.trim().toLowerCase();
  const list = query
    ? props.products.filter((p) => p.name.toLowerCase().includes(query))
    : [...props.products];

  if (sortMode.value === 'usage') {
    list.sort((a, b) => b.usageCount - a.usageCount || a.name.localeCompare(b.name, 'fr'));
  } else {
    list.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  }

  return list;
});

function handleRemove(product: GroceryProduct) {
  if (!confirm(`Retirer « ${product.name} » du catalogue personnel ?`)) return;
  emit('remove', product.id);
}
</script>

<template>
  <div class="space-y-4">
    <!-- Search + sort -->
    <div class="flex gap-2">
      <div class="relative flex-1">
        <Search
          class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-percy-text-muted"
        />
        <input
          v-model="search"
          type="text"
          placeholder="Rechercher un produit…"
          class="h-10 w-full rounded-md border border-percy-border-input bg-percy-bg-input pl-9 pr-3 text-sm text-percy-text-primary placeholder:text-percy-text-muted"
          data-testid="grocery-catalog-search"
        />
      </div>
      <select
        v-model="sortMode"
        class="rounded-md border border-percy-border bg-percy-bg-input px-3 text-sm text-percy-text-primary"
        data-testid="grocery-catalog-sort"
      >
        <option value="usage">Plus utilisés</option>
        <option value="name">Alphabétique</option>
      </select>
    </div>

    <!-- Empty state -->
    <div
      v-if="filteredProducts.length === 0"
      class="rounded-lg border border-dashed border-percy-border bg-percy-bg-card p-8 text-center text-sm text-percy-text-muted"
      data-testid="grocery-catalog-empty"
    >
      <template v-if="search.trim()">Aucun produit ne correspond.</template>
      <template v-else>Le catalogue se remplit au fur et à mesure que tu ajoutes des courses.</template>
    </div>

    <!-- Product list -->
    <ul v-else class="divide-y divide-percy-border rounded-md border border-percy-border">
      <li
        v-for="product in filteredProducts"
        :key="product.id"
        class="flex items-center gap-3 p-2"
        :data-testid="`grocery-catalog-row-${product.id}`"
      >
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm text-percy-text-primary">{{ product.name }}</p>
          <p class="text-xs text-percy-text-muted">
            <span v-if="product.category">{{ product.category.name }} · </span>
            <span>{{ product.usageCount }} ajout{{ product.usageCount > 1 ? 's' : '' }}</span>
          </p>
        </div>
        <button
          class="rounded-md p-1.5 text-percy-danger hover:bg-percy-bg-nav"
          :aria-label="`Supprimer ${product.name}`"
          :data-testid="`grocery-catalog-remove-${product.id}`"
          @click="handleRemove(product)"
        >
          <Trash2 class="h-4 w-4" />
        </button>
      </li>
    </ul>
  </div>
</template>
