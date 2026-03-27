<!--
  pages/skills/grocery-list.vue — Main grocery list skill page.
  Shows quick-add input, items grouped by category, and checked items section.
-->
<script setup lang="ts">
import { onMounted } from 'vue';
import { ShoppingCart, WifiOff } from 'lucide-vue-next';
import { useGroceryList } from '~/composables/use-grocery-list';
import type { GroceryItemInput } from '~/types/grocery';

definePageMeta({
  middleware: 'auth',
});

const {
  loading,
  error,
  activeItems,
  checkedItems,
  activeCount,
  itemsByCategory,
  pendingSync,
  isOnline,
  fetchItems,
  fetchCategories,
  addItem,
  toggleItem,
  removeItem,
  clearChecked,
  reorderItems,
} = useGroceryList();

function handleAdd(input: GroceryItemInput) {
  addItem(input);
}

onMounted(async () => {
  await Promise.all([fetchItems(), fetchCategories()]);
});
</script>

<template>
  <div class="mx-auto max-w-2xl space-y-4 p-4 sm:p-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="rounded-lg bg-primary/10 p-2">
          <ShoppingCart class="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 class="text-2xl font-bold" data-testid="grocery-title">Liste de courses</h1>
          <p v-if="activeCount > 0" class="text-sm text-percy-text-muted">
            {{ activeCount }} article{{ activeCount > 1 ? 's' : '' }} à acheter
          </p>
        </div>
      </div>

      <!-- Sync status -->
      <div
        v-if="!isOnline || pendingSync"
        class="flex items-center gap-1.5 text-xs text-percy-warning"
        data-testid="grocery-sync-status"
      >
        <WifiOff v-if="!isOnline" class="h-3.5 w-3.5" />
        <span v-if="!isOnline">Hors ligne</span>
        <span v-else-if="pendingSync">Synchronisation...</span>
      </div>
    </div>

    <!-- Quick add input -->
    <GroceryAddInput data-testid="grocery-add-section" @add="handleAdd" />

    <!-- Loading state -->
    <div v-if="loading" class="space-y-3">
      <Skeleton class="h-10 w-full" />
      <Skeleton class="h-10 w-full" />
      <Skeleton class="h-10 w-3/4" />
    </div>

    <!-- Error state -->
    <div
      v-else-if="error"
      class="rounded-lg border border-percy-danger/30 bg-percy-danger-light p-4 text-center text-sm text-percy-danger"
      data-testid="grocery-error"
    >
      {{ error }}
    </div>

    <!-- Empty state -->
    <div
      v-else-if="activeItems.length === 0 && checkedItems.length === 0"
      class="py-12 text-center"
      data-testid="grocery-empty"
    >
      <ShoppingCart class="mx-auto h-12 w-12 text-percy-text-muted" />
      <p class="mt-3 text-sm text-percy-text-muted">Votre liste est vide</p>
      <p class="text-xs text-percy-text-muted">Ajoutez un produit avec le champ ci-dessus</p>
    </div>

    <!-- Item list grouped by category -->
    <div v-else class="space-y-4">
      <!-- Grouped items (when categories exist) -->
      <template
        v-if="
          itemsByCategory.length > 1 ||
          (itemsByCategory.length === 1 && itemsByCategory[0]?.category)
        "
      >
        <GroceryCategoryGroup
          v-for="group in itemsByCategory"
          :key="group.category?.id ?? 'uncategorized'"
          :group="group"
          @toggle="toggleItem"
          @remove="removeItem"
          @reorder="reorderItems"
        />
      </template>

      <!-- Flat list (no categories) -->
      <template v-else>
        <GroceryItemRow
          v-for="item in activeItems"
          :key="item.id"
          :item="item"
          @toggle="toggleItem($event)"
          @remove="removeItem($event)"
        />
      </template>

      <!-- Checked items section -->
      <GroceryCheckedSection
        :items="checkedItems"
        @toggle="toggleItem"
        @remove="removeItem"
        @clear-all="clearChecked"
      />
    </div>
  </div>
</template>
