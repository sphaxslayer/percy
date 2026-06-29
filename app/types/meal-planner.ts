/**
 * app/types/meal-planner.ts — Shared types for the Meal Planner skill.
 * Mirrors the Prisma models with dates as ISO strings (the wire format).
 */

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

/** Human-friendly French label for each meal type — used by the UI. */
export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Petit-déjeuner',
  lunch: 'Déjeuner',
  dinner: 'Dîner',
  snack: 'Collation',
};

export interface RecipeIngredient {
  id: string;
  recipeId: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface Recipe {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  servings: number;
  prepMinutes: number | null;
  cookMinutes: number | null;
  ingredients: RecipeIngredient[];
  createdAt: string;
  updatedAt: string;
}

/** Input shape for creating or updating a recipe. Ingredients are managed separately. */
export interface RecipeInput {
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  servings?: number;
  prepMinutes?: number | null;
  cookMinutes?: number | null;
}

export interface RecipeIngredientInput {
  name: string;
  quantity?: number | null;
  unit?: string | null;
  sortOrder?: number;
}

export interface MealSlot {
  id: string;
  date: string; // ISO 8601 (server stores at 00:00 UTC of the day)
  mealType: MealType;
  recipeId: string | null;
  recipe: Recipe | null;
  servings: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MealSlotInput {
  date: string; // YYYY-MM-DD or full ISO
  mealType: MealType;
  recipeId?: string | null;
  servings?: number | null;
  notes?: string | null;
}
