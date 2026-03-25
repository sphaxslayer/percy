<!--
  grocery-add-input.vue — Quick-add input with autocomplete dropdown.
  Parses quantity from input (e.g. "Bananes x6") and shows product suggestions.
-->
<script setup lang="ts">
import { ref, computed } from 'vue';
import { Plus } from 'lucide-vue-next';
import { useGroceryAutocomplete, parseItemInput } from '~/composables/use-grocery-autocomplete';
import type { GroceryProduct, GroceryItemInput } from '~/types/grocery';

const emit = defineEmits<{
  add: [input: GroceryItemInput];
}>();

const { query, suggestions, loading, selectedIndex, selectSuggestion, clear, moveUp, moveDown } =
  useGroceryAutocomplete();

const inputRef = ref<HTMLInputElement | null>(null);
const showDropdown = computed(() => suggestions.value.length > 0);

function submit() {
  if (selectedIndex.value >= 0 && suggestions.value[selectedIndex.value]) {
    submitSuggestion(suggestions.value[selectedIndex.value]!);
    return;
  }

  const parsed = parseItemInput(query.value);
  if (!parsed.name.trim()) return;

  emit('add', {
    name: parsed.name,
    quantity: parsed.quantity,
    unit: parsed.unit,
  });
  clear();
}

function submitSuggestion(product: GroceryProduct) {
  const result = selectSuggestion(product);
  emit('add', {
    name: result.name,
    quantity: result.quantity,
    unit: result.unit,
    categoryId: product.categoryId ?? undefined,
  });
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    moveDown();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    moveUp();
  } else if (e.key === 'Escape') {
    clear();
  }
}
</script>

<template>
  <form class="relative" data-testid="grocery-add-form" @submit.prevent="submit">
    <div class="flex gap-2">
      <div class="relative flex-1">
        <input
          ref="inputRef"
          v-model="query"
          type="text"
          placeholder="Ajouter un produit..."
          class="h-10 w-full rounded-md border border-percy-border-input bg-percy-bg-input px-3 text-sm text-percy-text-primary shadow-sm placeholder:text-percy-text-muted focus:border-percy-primary focus:outline-none focus:ring-1 focus:ring-percy-primary"
          data-testid="grocery-add-input"
          autocomplete="off"
          @keydown="handleKeydown"
        />

        <!-- Autocomplete dropdown -->
        <div
          v-if="showDropdown"
          class="absolute z-10 mt-1 w-full rounded-md border border-percy-border bg-percy-bg-card py-1 shadow-md"
          data-testid="grocery-autocomplete-dropdown"
        >
          <button
            v-for="(product, index) in suggestions"
            :key="product.id"
            type="button"
            class="flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors"
            :class="index === selectedIndex ? 'bg-percy-bg-nav' : 'hover:bg-percy-bg-page'"
            :data-testid="`grocery-suggestion-${index}`"
            @click="submitSuggestion(product)"
          >
            <span>{{ product.name }}</span>
            <span v-if="product.category" class="text-xs text-percy-text-muted">
              {{ product.category.name }}
            </span>
          </button>
        </div>
      </div>

      <Button type="submit" size="icon" :disabled="!query.trim()" data-testid="grocery-add-button">
        <Plus class="h-4 w-4" />
      </Button>
    </div>

    <div v-if="loading" class="absolute right-14 top-2.5">
      <div class="h-5 w-5 animate-spin rounded-full border-2 border-percy-border border-t-percy-primary" />
    </div>
  </form>
</template>
