<!--
  pages/skills/meal-planner.vue — Main page for the Meal Planner skill.
  Two tabs:
    - "Recettes" : grid of recipes with create/edit/delete + push-to-grocery.
    - "Planning" : weekly meal slots, click empty cell to assign a recipe.
-->
<script setup lang="ts">
import { ChefHat, CalendarDays, Plus } from 'lucide-vue-next';
import { useRecipes } from '~/composables/use-recipes';
import { useMealSlots } from '~/composables/use-meal-slots';
import type { MealSlot, MealType, Recipe } from '~/types/meal-planner';

definePageMeta({ middleware: 'auth' });

const {
  recipes,
  fetchRecipes,
  addRecipe,
  updateRecipe,
  removeRecipe,
  addIngredient,
  removeIngredient,
  pushToGrocery,
} = useRecipes();

const {
  weekDays,
  mealTypes,
  slotsByDay: _slotsByDay,
  getSlot,
  fetchSlots,
  setSlot,
  removeSlot,
  goToPreviousWeek,
  goToNextWeek,
  goToCurrentWeek,
  weekStart,
} = useMealSlots();

const activeTab = ref<'recipes' | 'planner'>('recipes');

// ─── Recipe modal state ────────────────────────────────────────────────
const recipeModalOpen = ref(false);
const editingRecipe = ref<Recipe | null>(null);

function openCreateRecipe() {
  editingRecipe.value = null;
  recipeModalOpen.value = true;
}

function openEditRecipe(recipe: Recipe) {
  editingRecipe.value = recipe;
  recipeModalOpen.value = true;
}

async function handleSaveRecipe(payload: {
  recipe: import('~/types/meal-planner').RecipeInput;
  ingredients: import('~/types/meal-planner').RecipeIngredientInput[];
}) {
  if (editingRecipe.value) {
    // Update the recipe metadata, then reconcile ingredients (simple
    // approach: drop existing, add new). For an MVP this keeps the flow
    // simple — optimising can come later if it becomes a concern.
    const updated = await updateRecipe(editingRecipe.value.id, payload.recipe);
    const existingIds = editingRecipe.value.ingredients.map((i) => i.id);
    for (const id of existingIds) {
      await removeIngredient(updated.id, id);
    }
    for (const ing of payload.ingredients) {
      await addIngredient(updated.id, ing);
    }
  } else {
    await addRecipe({ ...payload.recipe, ingredients: payload.ingredients });
  }
  recipeModalOpen.value = false;
  editingRecipe.value = null;
}

async function handleRemoveRecipe(recipe: Recipe) {
  if (!confirm(`Supprimer la recette "${recipe.name}" ?`)) return;
  await removeRecipe(recipe.id);
}

async function handlePushToGrocery(recipe: Recipe) {
  const added = await pushToGrocery(recipe.id);
  // Light feedback via alert — a toast system can replace this later.
  alert(`${added} ingrédient${added > 1 ? 's ajoutés' : ' ajouté'} à la liste de courses.`);
}

// ─── Planner actions ───────────────────────────────────────────────────
async function handleAssignSlot(payload: {
  date: Date;
  mealType: MealType;
  recipeId: string;
}) {
  await setSlot({
    date: payload.date.toISOString(),
    mealType: payload.mealType,
    recipeId: payload.recipeId,
  });
}

async function handleClearSlot(slot: MealSlot) {
  await removeSlot(slot.id);
}

// Refetch slots whenever the displayed week changes.
watch(weekStart, () => {
  fetchSlots();
});

onMounted(async () => {
  await Promise.all([fetchRecipes(), fetchSlots()]);
});
</script>

<template>
  <div class="space-y-6">
    <!-- Page header -->
    <header class="flex items-center gap-3">
      <ChefHat class="h-6 w-6 text-percy-primary" />
      <h1 class="text-2xl font-bold text-percy-text-primary">Planificateur de repas</h1>
    </header>

    <!-- Tabs -->
    <div class="flex gap-1 border-b border-percy-border">
      <button
        class="flex items-center gap-2 border-b-2 px-4 py-2 text-sm"
        :class="
          activeTab === 'recipes'
            ? 'border-percy-primary text-percy-primary'
            : 'border-transparent text-percy-text-secondary hover:text-percy-text-primary'
        "
        data-testid="tab-recipes"
        @click="activeTab = 'recipes'"
      >
        <ChefHat class="h-4 w-4" />
        Recettes
      </button>
      <button
        class="flex items-center gap-2 border-b-2 px-4 py-2 text-sm"
        :class="
          activeTab === 'planner'
            ? 'border-percy-primary text-percy-primary'
            : 'border-transparent text-percy-text-secondary hover:text-percy-text-primary'
        "
        data-testid="tab-planner"
        @click="activeTab = 'planner'"
      >
        <CalendarDays class="h-4 w-4" />
        Planning
      </button>
    </div>

    <!-- Recipes tab -->
    <section v-if="activeTab === 'recipes'" class="space-y-4">
      <div class="flex justify-end">
        <button
          class="flex items-center gap-2 rounded-md bg-percy-primary px-4 py-2 text-sm font-medium text-percy-primary-text hover:opacity-90"
          data-testid="recipe-create"
          @click="openCreateRecipe"
        >
          <Plus class="h-4 w-4" />
          Nouvelle recette
        </button>
      </div>

      <div
        v-if="recipes.length === 0"
        class="rounded-lg border border-dashed border-percy-border bg-percy-bg-card p-12 text-center text-percy-text-muted"
      >
        Aucune recette pour l'instant. Crée ta première recette pour commencer.
      </div>

      <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <RecipeCard
          v-for="recipe in recipes"
          :key="recipe.id"
          :recipe="recipe"
          @edit="openEditRecipe"
          @remove="handleRemoveRecipe"
          @push-to-grocery="handlePushToGrocery"
        />
      </div>
    </section>

    <!-- Planner tab -->
    <section v-else>
      <WeekPlanner
        :week-days="weekDays"
        :meal-types="mealTypes"
        :get-slot="getSlot"
        :recipes="recipes"
        @previous-week="goToPreviousWeek"
        @next-week="goToNextWeek"
        @current-week="goToCurrentWeek"
        @assign="handleAssignSlot"
        @clear="handleClearSlot"
      />
    </section>

    <RecipeModal
      :open="recipeModalOpen"
      :recipe="editingRecipe"
      @close="recipeModalOpen = false"
      @save="handleSaveRecipe"
    />
  </div>
</template>
