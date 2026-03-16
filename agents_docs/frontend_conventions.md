# Frontend Conventions — Vue 3 / Nuxt 3

## Role Context
When Claude reads this file, it should think as a **Senior Frontend Engineer** specializing in Vue 3 ecosystem.
Focus: clean components, type safety, performance, UX consistency.

## Component Structure

### Single File Component Template
```vue
<script setup lang="ts">
// 1. Imports
import { ref, computed, onMounted } from 'vue'
import type { SkillItem } from '~/types/skills'

// 2. Props & Emits
const props = defineProps<{
  title: string
  items: SkillItem[]
  loading?: boolean
}>()

const emit = defineEmits<{
  select: [item: SkillItem]
  delete: [id: string]
}>()

// 3. Reactive state
const searchQuery = ref('')

// 4. Computed
const filteredItems = computed(() =>
  props.items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
)

// 5. Methods
function handleSelect(item: SkillItem) {
  emit('select', item)
}

// 6. Lifecycle
onMounted(() => {
  // ...
})
</script>

<template>
  <!-- Single root element preferred for clarity -->
  <div class="skill-container">
    <!-- Template content -->
  </div>
</template>

<style scoped>
/* Scoped styles only. Prefer Tailwind utilities in template. */
/* Use <style scoped> only for complex/dynamic styling Tailwind can't handle. */
</style>
```

### Naming Rules
| What | Convention | Example |
|------|-----------|---------|
| File names | kebab-case | `skill-card.vue` |
| Component usage in template | PascalCase | `<SkillCard />` |
| Composable files | `use-*.ts` | `use-todo-list.ts` |
| Composable functions | `use*` | `useTodoList()` |
| Pinia stores | `use-*-store.ts` | `use-auth-store.ts` |
| Type files | `*.ts` in `types/` | `types/skills.ts` |
| Page files | kebab-case | `pages/skills/todo-list.vue` |

## Composables Pattern

Every piece of reusable logic should be a composable. A composable is a function that uses Vue's Composition API (ref, computed, watch, etc.) and returns reactive state + methods.

```typescript
// composables/use-todo-list.ts
import { ref, computed } from 'vue'
import type { Todo } from '~/types/skills'

export function useTodoList() {
  const todos = ref<Todo[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const completedCount = computed(() =>
    todos.value.filter(t => t.completed).length
  )

  async function fetchTodos() {
    loading.value = true
    error.value = null
    try {
      const data = await $fetch<Todo[]>('/api/skills/todos')
      todos.value = data
    } catch (e) {
      error.value = 'Impossible de charger les tâches'
    } finally {
      loading.value = false
    }
  }

  async function addTodo(title: string) {
    const newTodo = await $fetch<Todo>('/api/skills/todos', {
      method: 'POST',
      body: { title }
    })
    todos.value.push(newTodo)
  }

  return {
    todos,
    loading,
    error,
    completedCount,
    fetchTodos,
    addTodo
  }
}
```

## API Calls
- Use Nuxt's `$fetch` (built-in, typed, handles SSR).
- NEVER use raw `fetch()` or `axios`.
- For data fetching in pages/components, prefer `useAsyncData` or `useFetch`:
```vue
<script setup lang="ts">
const { data: todos, pending, error } = await useFetch('/api/skills/todos')
</script>
```

## Styling Rules
- **Primary method**: Tailwind CSS utility classes in templates.
- **Component library**: shadcn-vue for UI primitives (Button, Input, Card, Dialog, etc.).
- **Custom styles**: Only when Tailwind can't express it. Always `<style scoped>`.
- **No global CSS** except in `assets/css/main.css` (Tailwind directives + global resets).
- **Dark mode**: Prepare for it by using Tailwind `dark:` prefix. Not mandatory for v1.
- **Responsive**: Mobile-first. Every layout must work on 375px+ widths.

## Layout System
```
layouts/
├── default.vue     # Authenticated layout: sidebar + header + content area
├── auth.vue        # Login/register pages: centered card
└── empty.vue       # Bare layout for special pages
```

The dashboard layout (`default.vue`) has:
- Collapsible sidebar with skill navigation
- Top header with user menu / notifications
- Main content area (the `<slot />`)

## Accessibility Minimums
- All interactive elements must be keyboard-navigable.
- Images need `alt` attributes.
- Form inputs need associated `<label>` elements.
- Use semantic HTML (`<nav>`, `<main>`, `<section>`, `<article>`).
- shadcn-vue handles most ARIA attributes — don't override them.

## Performance Guidelines
- Use `<Suspense>` + `<NuxtLoadingIndicator>` for async pages.
- Lazy-load skill pages: Nuxt does this by default with file-based routing.
- Lazy-load heavy components: `const HeavyChart = defineAsyncComponent(() => import('./HeavyChart.vue'))`.
- Images: use `<NuxtImg>` for optimization.
