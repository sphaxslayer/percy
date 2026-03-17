/**
 * app/types/grocery.ts — TypeScript interfaces for the Grocery List skill.
 * Matches the Prisma models but uses serialized types (string dates, etc.)
 * suitable for client-side usage after JSON transport.
 */

export interface GroceryCategory {
  id: string;
  name: string;
  sortOrder: number;
  _count?: { items: number };
}

export interface GroceryProduct {
  id: string;
  name: string;
  categoryId: string | null;
  category: GroceryCategory | null;
  usageCount: number;
}

export interface GroceryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string | null;
  categoryId: string | null;
  category: GroceryCategory | null;
  checked: boolean;
  checkedAt: string | null;
  sortOrder: number;
  createdAt: string;
}

/** Input for creating a new grocery item */
export interface GroceryItemInput {
  name: string;
  quantity?: number;
  unit?: string;
  categoryId?: string;
}

/** Result of parsing user input like "Bananes x6" or "Lait 2L" */
export interface ParsedItemInput {
  name: string;
  quantity: number;
  unit?: string;
}

/** A group of items under a category header */
export interface GroceryItemGroup {
  category: GroceryCategory | null;
  items: GroceryItem[];
}
