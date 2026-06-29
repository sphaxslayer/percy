<!--
  recipe-modal.vue — Modal to create or edit a recipe with its ingredient list.
  - Standalone form for the recipe metadata (name, description, servings, times).
  - Inline editor for ingredients (add / remove rows).
  - Emits `save` once the user confirms; the parent persists.
-->
<script setup lang="ts">
import { Plus, Trash2, X } from 'lucide-vue-next';
import type {
  Recipe,
  RecipeInput,
  RecipeIngredientInput,
} from '~/types/meal-planner';

const props = defineProps<{
  open: boolean;
  /** When provided, the modal opens in edit mode and pre-fills the form. */
  recipe?: Recipe | null;
}>();

const emit = defineEmits<{
  close: [];
  save: [payload: { recipe: RecipeInput; ingredients: RecipeIngredientInput[] }];
}>();

const name = ref('');
const description = ref('');
const servings = ref(2);
const prepMinutes = ref<number | null>(null);
const cookMinutes = ref<number | null>(null);
const ingredients = ref<RecipeIngredientInput[]>([]);

// Reset / hydrate every time the modal opens.
watch(
  () => props.open,
  (open) => {
    if (!open) return;
    if (props.recipe) {
      name.value = props.recipe.name;
      description.value = props.recipe.description ?? '';
      servings.value = props.recipe.servings;
      prepMinutes.value = props.recipe.prepMinutes;
      cookMinutes.value = props.recipe.cookMinutes;
      ingredients.value = props.recipe.ingredients.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        unit: i.unit,
      }));
    } else {
      name.value = '';
      description.value = '';
      servings.value = 2;
      prepMinutes.value = null;
      cookMinutes.value = null;
      ingredients.value = [{ name: '', quantity: null, unit: null }];
    }
  },
);

function addIngredientRow() {
  ingredients.value = [...ingredients.value, { name: '', quantity: null, unit: null }];
}

function removeIngredientRow(index: number) {
  ingredients.value = ingredients.value.filter((_, i) => i !== index);
}

function handleSave() {
  if (!name.value.trim()) return;
  const cleanedIngredients = ingredients.value
    .filter((i) => i.name.trim().length > 0)
    .map((i, index) => ({
      name: i.name.trim(),
      quantity: i.quantity ?? null,
      unit: i.unit?.trim() || null,
      sortOrder: index,
    }));

  emit('save', {
    recipe: {
      name: name.value.trim(),
      description: description.value.trim() || null,
      servings: servings.value,
      prepMinutes: prepMinutes.value,
      cookMinutes: cookMinutes.value,
    },
    ingredients: cleanedIngredients,
  });
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      data-testid="recipe-modal"
      @click.self="emit('close')"
    >
      <div class="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg bg-percy-bg-card shadow-xl">
        <header class="flex items-center justify-between border-b border-percy-border p-4">
          <h2 class="text-lg font-semibold text-percy-text-primary">
            {{ recipe ? 'Modifier la recette' : 'Nouvelle recette' }}
          </h2>
          <button
            class="rounded-md p-1 text-percy-text-muted hover:bg-percy-bg-nav"
            aria-label="Fermer"
            @click="emit('close')"
          >
            <X class="h-5 w-5" />
          </button>
        </header>

        <div class="flex-1 space-y-4 overflow-y-auto p-4">
          <!-- Recipe metadata -->
          <div>
            <label class="mb-1 block text-xs font-medium text-percy-text-secondary">Nom *</label>
            <input
              v-model="name"
              type="text"
              class="w-full rounded-md border border-percy-border bg-percy-bg-input px-3 py-2 text-sm text-percy-text-primary"
              placeholder="Pâtes carbonara"
              data-testid="recipe-name-input"
            />
          </div>

          <div>
            <label class="mb-1 block text-xs font-medium text-percy-text-secondary">Description</label>
            <textarea
              v-model="description"
              rows="2"
              class="w-full rounded-md border border-percy-border bg-percy-bg-input px-3 py-2 text-sm text-percy-text-primary"
              placeholder="Quelques mots sur la recette…"
            />
          </div>

          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="mb-1 block text-xs font-medium text-percy-text-secondary">Portions</label>
              <input
                v-model.number="servings"
                type="number"
                min="1"
                max="50"
                class="w-full rounded-md border border-percy-border bg-percy-bg-input px-3 py-2 text-sm text-percy-text-primary"
              />
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-percy-text-secondary">Préparation (min)</label>
              <input
                v-model.number="prepMinutes"
                type="number"
                min="0"
                class="w-full rounded-md border border-percy-border bg-percy-bg-input px-3 py-2 text-sm text-percy-text-primary"
              />
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-percy-text-secondary">Cuisson (min)</label>
              <input
                v-model.number="cookMinutes"
                type="number"
                min="0"
                class="w-full rounded-md border border-percy-border bg-percy-bg-input px-3 py-2 text-sm text-percy-text-primary"
              />
            </div>
          </div>

          <!-- Ingredient list -->
          <div>
            <div class="mb-2 flex items-center justify-between">
              <label class="text-xs font-medium text-percy-text-secondary">Ingrédients</label>
              <button
                class="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-percy-primary hover:bg-percy-bg-nav"
                data-testid="recipe-add-ingredient"
                @click="addIngredientRow"
              >
                <Plus class="h-3.5 w-3.5" />
                Ajouter
              </button>
            </div>

            <div class="space-y-2">
              <div
                v-for="(ing, index) in ingredients"
                :key="index"
                class="flex items-center gap-2"
              >
                <input
                  v-model="ing.name"
                  type="text"
                  placeholder="Nom"
                  class="flex-1 rounded-md border border-percy-border bg-percy-bg-input px-3 py-1.5 text-sm text-percy-text-primary"
                />
                <input
                  v-model.number="ing.quantity"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="Qté"
                  class="w-20 rounded-md border border-percy-border bg-percy-bg-input px-3 py-1.5 text-sm text-percy-text-primary"
                />
                <input
                  v-model="ing.unit"
                  type="text"
                  placeholder="Unité"
                  class="w-20 rounded-md border border-percy-border bg-percy-bg-input px-3 py-1.5 text-sm text-percy-text-primary"
                />
                <button
                  class="rounded-md p-1 text-percy-danger hover:bg-percy-bg-nav"
                  aria-label="Supprimer cet ingrédient"
                  @click="removeIngredientRow(index)"
                >
                  <Trash2 class="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <footer class="flex justify-end gap-2 border-t border-percy-border p-4">
          <button
            class="rounded-md px-4 py-2 text-sm text-percy-text-secondary hover:bg-percy-bg-nav"
            @click="emit('close')"
          >
            Annuler
          </button>
          <button
            class="rounded-md bg-percy-primary px-4 py-2 text-sm font-medium text-percy-primary-text hover:opacity-90 disabled:opacity-50"
            :disabled="!name.trim()"
            data-testid="recipe-save"
            @click="handleSave"
          >
            {{ recipe ? 'Enregistrer' : 'Créer' }}
          </button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>
