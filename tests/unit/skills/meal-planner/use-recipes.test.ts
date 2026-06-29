/**
 * Unit tests for the recipes composable.
 * Covers CRUD delegation to useCrudList, nested ingredient ops, and the
 * cross-skill push-to-grocery bridge.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useRecipes } from '~/composables/use-recipes';
import { API } from '~/lib/routes';

const mockFetch = vi.fn();
vi.stubGlobal('$fetch', mockFetch);

// Factory rather than a constant so each test gets a fresh nested object
// — useRecipes mutates the ingredients array in-place, which would otherwise
// leak state across tests.
function makeRecipe() {
  return {
    id: 'recipe-1',
    name: 'Pâtes carbonara',
    description: null,
    imageUrl: null,
    servings: 2,
    prepMinutes: 10,
    cookMinutes: 15,
    ingredients: [
      { id: 'ing-1', recipeId: 'recipe-1', name: 'Pâtes', quantity: 250, unit: 'g', sortOrder: 0, createdAt: '2026-01-01T00:00:00.000Z' },
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('useRecipes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetchRecipes calls the canonical endpoint and populates the list', async () => {
    mockFetch.mockResolvedValue({ data: [makeRecipe()] });
    const { recipes, fetchRecipes } = useRecipes();

    await fetchRecipes();

    expect(mockFetch).toHaveBeenCalledWith(API.skills.mealPlanner.recipes);
    expect(recipes.value).toHaveLength(1);
    expect(recipes.value[0]!.name).toBe('Pâtes carbonara');
  });

  it('addIngredient appends the new ingredient to the local recipe', async () => {
    // First the initial list load, then the POST.
    mockFetch
      .mockResolvedValueOnce({ data: [makeRecipe()] })
      .mockResolvedValueOnce({
        data: { id: 'ing-2', recipeId: 'recipe-1', name: 'Oeuf', quantity: 2, unit: null, sortOrder: 1, createdAt: '2026-01-02T00:00:00.000Z' },
      });

    const { recipes, fetchRecipes, addIngredient } = useRecipes();
    await fetchRecipes();
    await addIngredient('recipe-1', { name: 'Oeuf', quantity: 2 });

    expect(recipes.value[0]!.ingredients).toHaveLength(2);
    expect(recipes.value[0]!.ingredients[1]!.name).toBe('Oeuf');
  });

  it('removeIngredient strips the ingredient from local state', async () => {
    mockFetch
      .mockResolvedValueOnce({ data: [makeRecipe()] })
      .mockResolvedValueOnce({ data: { deleted: true } });

    const { recipes, fetchRecipes, removeIngredient } = useRecipes();
    await fetchRecipes();
    await removeIngredient('recipe-1', 'ing-1');

    expect(recipes.value[0]!.ingredients).toHaveLength(0);
  });

  it('pushToGrocery posts to the bridge endpoint and returns the added count', async () => {
    mockFetch.mockResolvedValue({ data: { added: 5 } });
    const { pushToGrocery } = useRecipes();

    const added = await pushToGrocery('recipe-1', 2);

    expect(mockFetch).toHaveBeenCalledWith(
      `${API.skills.mealPlanner.recipes}/recipe-1/push-to-grocery`,
      { method: 'POST', body: { servingsMultiplier: 2 } },
    );
    expect(added).toBe(5);
  });
});
