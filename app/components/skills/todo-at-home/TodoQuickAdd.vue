<!--
  TodoQuickAdd.vue — Inline quick-add form for creating a task.
  Minimal: title + context selector + submit.
-->
<script setup lang="ts">
import type { TodoContext } from '~/types/todo';

const props = defineProps<{
  contexts: TodoContext[];
}>();

const emit = defineEmits<{
  add: [payload: { contextId: string; title: string }];
}>();

const title = ref('');
const selectedContextId = ref('');

// Default to first context
watch(
  () => props.contexts,
  (ctxs) => {
    if (!selectedContextId.value && ctxs.length > 0) {
      selectedContextId.value = ctxs[0]!.id;
    }
  },
  { immediate: true },
);

function handleSubmit() {
  const trimmed = title.value.trim();
  if (!trimmed || !selectedContextId.value) return;
  emit('add', { contextId: selectedContextId.value, title: trimmed });
  title.value = '';
}
</script>

<template>
  <form
    class="flex flex-col gap-2 rounded-lg border border-percy-border bg-percy-bg-card p-3 sm:flex-row sm:items-end"
    data-testid="todo-quick-add"
    @submit.prevent="handleSubmit"
  >
    <div class="flex-1">
      <label class="mb-1 block text-xs font-semibold text-percy-text-secondary">TODO rapide</label>
      <input
        v-model="title"
        type="text"
        placeholder="Titre de la tâche..."
        class="w-full rounded-md border border-percy-border-input bg-percy-bg-input px-3 py-2 text-sm text-percy-text-primary placeholder:text-percy-text-muted focus:border-percy-primary focus:outline-none focus:ring-2 focus:ring-percy-primary/30"
        data-testid="todo-quick-add-input"
      />
    </div>

    <div class="sm:w-40">
      <label class="mb-1 block text-xs font-semibold text-percy-text-secondary">Contexte</label>
      <select
        v-model="selectedContextId"
        class="w-full rounded-md border border-percy-border-input bg-percy-bg-input px-3 py-2 text-sm text-percy-text-primary focus:border-percy-primary focus:outline-none focus:ring-2 focus:ring-percy-primary/30"
        data-testid="todo-quick-add-context"
      >
        <option v-for="ctx in contexts" :key="ctx.id" :value="ctx.id">
          {{ ctx.icon }} {{ ctx.name }}
        </option>
      </select>
    </div>

    <button
      type="submit"
      :disabled="!title.trim()"
      class="rounded-md bg-percy-primary px-4 py-2 text-sm font-bold text-percy-primary-text transition-colors hover:bg-percy-primary-hover disabled:opacity-50"
      data-testid="todo-quick-add-submit"
    >
      Créer
    </button>
  </form>
</template>
