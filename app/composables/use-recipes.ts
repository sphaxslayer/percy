/**
 * app/composables/use-recipes.ts — Recipes CRUD + nested ingredient management
 * and a cross-skill helper to push a recipe's ingredients into the grocery list.
 */
import { useCrudList } from './use-crud-list';
import { API } from '~/lib/routes';
import type {
  Recipe,
  RecipeInput,
  RecipeIngredient,
  RecipeIngredientInput,
} from '~/types/meal-planner';

type RecipeCreateInput = RecipeInput & {
  ingredients?: RecipeIngredientInput[];
};

export function useRecipes() {
  const crud = useCrudList<Recipe, RecipeCreateInput, Partial<RecipeInput>>({
    baseUrl: API.skills.mealPlanner.recipes,
    fetchErrorMessage: 'Impossible de charger les recettes',
  });

  // ─── Ingredient management (nested under a recipe) ──────────────────
  async function addIngredient(recipeId: string, input: RecipeIngredientInput) {
    const res = await $fetch<{ data: RecipeIngredient }>(
      `${API.skills.mealPlanner.recipes}/${recipeId}/ingredients`,
      { method: 'POST', body: input },
    );
    const recipe = crud.items.value.find((r) => r.id === recipeId);
    if (recipe) {
      recipe.ingredients = [...recipe.ingredients, res.data];
    }
    return res.data;
  }

  async function updateIngredient(
    recipeId: string,
    ingredientId: string,
    data: Partial<RecipeIngredientInput>,
  ) {
    const res = await $fetch<{ data: RecipeIngredient }>(
      `${API.skills.mealPlanner.recipes}/${recipeId}/ingredients/${ingredientId}`,
      { method: 'PATCH', body: data },
    );
    const recipe = crud.items.value.find((r) => r.id === recipeId);
    if (recipe) {
      recipe.ingredients = recipe.ingredients.map((i) => (i.id === ingredientId ? res.data : i));
    }
    return res.data;
  }

  async function removeIngredient(recipeId: string, ingredientId: string) {
    await $fetch(
      `${API.skills.mealPlanner.recipes}/${recipeId}/ingredients/${ingredientId}`,
      { method: 'DELETE' },
    );
    const recipe = crud.items.value.find((r) => r.id === recipeId);
    if (recipe) {
      recipe.ingredients = recipe.ingredients.filter((i) => i.id !== ingredientId);
    }
  }

  // ─── Cross-skill bridge: push to grocery list ───────────────────────
  async function pushToGrocery(recipeId: string, servingsMultiplier?: number) {
    const res = await $fetch<{ data: { added: number } }>(
      `${API.skills.mealPlanner.recipes}/${recipeId}/push-to-grocery`,
      { method: 'POST', body: { servingsMultiplier } },
    );
    return res.data.added;
  }

  return {
    recipes: crud.items,
    loading: crud.loading,
    error: crud.error,
    fetchRecipes: crud.fetchAll,
    addRecipe: crud.add,
    updateRecipe: crud.update,
    removeRecipe: crud.remove,
    addIngredient,
    updateIngredient,
    removeIngredient,
    pushToGrocery,
  };
}
