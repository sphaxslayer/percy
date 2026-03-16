/**
 * app/composables/use-grocery-autocomplete.ts — Autocomplete for grocery products.
 *
 * Queries the user's product catalog as they type, providing suggestions
 * sorted by usage frequency. Also parses quantity from input (e.g. "Bananes x6").
 */
import { ref, watch } from 'vue'
import type { GroceryProduct, ParsedItemInput } from '~/types/grocery'

const API_BASE = '/api/skills/grocery'
const DEBOUNCE_MS = 250
const MIN_QUERY_LENGTH = 2

/**
 * Parse user input to extract product name and optional quantity/unit.
 * Supports formats like:
 *   "Bananes x6", "Bananes × 6", "Bananes 6", "Lait 2L", "Lait 2 L"
 */
export function parseItemInput(input: string): ParsedItemInput {
  const trimmed = input.trim()
  if (!trimmed) return { name: '', quantity: 1 }

  // Match: "name x6", "name × 6", "name X6"
  const multiplyMatch = trimmed.match(/^(.+?)\s*[x×X]\s*(\d+)\s*(\w*)$/)
  if (multiplyMatch) {
    return {
      name: multiplyMatch[1]!.trim(),
      quantity: parseInt(multiplyMatch[2]!, 10),
      unit: multiplyMatch[3] || undefined,
    }
  }

  // Match: "name 2kg", "name 2 kg", "name 2L"
  const quantityUnitMatch = trimmed.match(/^(.+?)\s+(\d+)\s*([a-zA-Z]+)$/)
  if (quantityUnitMatch) {
    return {
      name: quantityUnitMatch[1]!.trim(),
      quantity: parseInt(quantityUnitMatch[2]!, 10),
      unit: quantityUnitMatch[3],
    }
  }

  // Match: "name 6" (trailing number = quantity, no unit)
  const trailingNumberMatch = trimmed.match(/^(.+?)\s+(\d+)$/)
  if (trailingNumberMatch) {
    return {
      name: trailingNumberMatch[1]!.trim(),
      quantity: parseInt(trailingNumberMatch[2]!, 10),
    }
  }

  return { name: trimmed, quantity: 1 }
}

export function useGroceryAutocomplete() {
  const query = ref('')
  const suggestions = ref<GroceryProduct[]>([])
  const loading = ref(false)
  const selectedIndex = ref(-1)

  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  async function fetchSuggestions(search: string) {
    if (search.length < MIN_QUERY_LENGTH) {
      suggestions.value = []
      return
    }

    loading.value = true
    try {
      // Extract the name part (without quantity) for the API search
      const { name } = parseItemInput(search)
      if (name.length < MIN_QUERY_LENGTH) {
        suggestions.value = []
        return
      }

      const res = await $fetch<{ data: GroceryProduct[] }>(`${API_BASE}/products`, {
        query: { search: name },
      })
      suggestions.value = res.data
    } catch {
      suggestions.value = []
    } finally {
      loading.value = false
    }
  }

  // Debounced watch on query changes
  watch(query, (newQuery) => {
    selectedIndex.value = -1
    if (debounceTimer) clearTimeout(debounceTimer)

    if (newQuery.length < MIN_QUERY_LENGTH) {
      suggestions.value = []
      return
    }

    debounceTimer = setTimeout(() => {
      fetchSuggestions(newQuery)
    }, DEBOUNCE_MS)
  })

  function selectSuggestion(product: GroceryProduct): ParsedItemInput {
    const parsed = parseItemInput(query.value)
    query.value = ''
    suggestions.value = []
    selectedIndex.value = -1

    return {
      name: product.name,
      quantity: parsed.quantity,
      unit: parsed.unit,
    }
  }

  function clear() {
    query.value = ''
    suggestions.value = []
    selectedIndex.value = -1
  }

  // Keyboard navigation helpers
  function moveUp() {
    if (selectedIndex.value > 0) selectedIndex.value--
  }

  function moveDown() {
    if (selectedIndex.value < suggestions.value.length - 1) selectedIndex.value++
  }

  return {
    query,
    suggestions,
    loading,
    selectedIndex,
    selectSuggestion,
    clear,
    moveUp,
    moveDown,
  }
}
