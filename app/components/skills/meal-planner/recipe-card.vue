<!--
  recipe-card.vue — Compact card showing a recipe's headline + meta + actions.
  Used in the "Recettes" tab grid. Emits events; the parent owns the data.
-->
<script setup lang="ts">
import { ChefHat, Pencil, ShoppingCart, Trash2 } from 'lucide-vue-next';
import type { Recipe } from '~/types/meal-planner';

const props = defineProps<{
  recipe: Recipe;
}>();

const emit = defineEmits<{
  edit: [recipe: Recipe];
  remove: [recipe: Recipe];
  pushToGrocery: [recipe: Recipe];
}>();

const totalMinutes = computed(() => {
  const prep = props.recipe.prepMinutes ?? 0;
  const cook = props.recipe.cookMinutes ?? 0;
  return prep + cook;
});

const ingredientCount = computed(() => props.recipe.ingredients.length);
</script>

<template>
  <article
    class="flex flex-col gap-3 rounded-lg border border-percy-border bg-percy-bg-card p-4"
    :data-testid="`recipe-card-${recipe.id}`"
  >
    <header class="flex items-start gap-3">
      <div
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-percy-bg-nav text-percy-primary"
      >
        <ChefHat class="h-5 w-5" />
      </div>
      <div class="min-w-0 flex-1">
        <h3 class="truncate text-base font-semibold text-percy-text-primary">
          {{ recipe.name }}
        </h3>
        <p v-if="recipe.description" class="line-clamp-2 text-sm text-percy-text-secondary">
          {{ recipe.description }}
        </p>
      </div>
    </header>

    <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-percy-text-muted">
      <span>{{ recipe.servings }} portions</span>
      <span v-if="totalMinutes > 0">{{ totalMinutes }} min</span>
      <span>{{ ingredientCount }} ingrédient{{ ingredientCount > 1 ? 's' : '' }}</span>
    </div>

    <div class="flex justify-end gap-1 border-t border-percy-border pt-3">
      <button
        class="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-percy-text-secondary hover:bg-percy-bg-nav"
        :data-testid="`recipe-push-to-grocery-${recipe.id}`"
        @click="emit('pushToGrocery', recipe)"
      >
        <ShoppingCart class="h-3.5 w-3.5" />
        Liste de courses
      </button>
      <button
        class="rounded-md p-1.5 text-percy-text-secondary hover:bg-percy-bg-nav"
        :aria-label="`Modifier ${recipe.name}`"
        :data-testid="`recipe-edit-${recipe.id}`"
        @click="emit('edit', recipe)"
      >
        <Pencil class="h-4 w-4" />
      </button>
      <button
        class="rounded-md p-1.5 text-percy-danger hover:bg-percy-bg-nav"
        :aria-label="`Supprimer ${recipe.name}`"
        :data-testid="`recipe-remove-${recipe.id}`"
        @click="emit('remove', recipe)"
      >
        <Trash2 class="h-4 w-4" />
      </button>
    </div>
  </article>
</template>
