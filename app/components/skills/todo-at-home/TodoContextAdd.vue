<!--
  TodoContextAdd.vue — Inline form to add a new context (room/area).
-->
<script setup lang="ts">

const props = defineProps<{
  domainId: string;
}>();

const emit = defineEmits<{
  add: [payload: { domainId: string; name: string; color: string }];
}>();

const name = ref('');
const color = ref('#F59E0B');

const presetColors = [
  '#F59E0B', '#EF4444', '#3B82F6', '#10B981',
  '#8B5CF6', '#F97316', '#EC4899', '#6366F1',
];

function handleSubmit() {
  const trimmed = name.value.trim();
  if (!trimmed) return;
  emit('add', { domainId: props.domainId, name: trimmed, color: color.value });
  name.value = '';
}
</script>

<template>
  <form
    class="flex flex-col gap-3 rounded-lg border border-dashed border-percy-border bg-percy-bg-card p-3"
    data-testid="todo-context-add"
    @submit.prevent="handleSubmit"
  >
    <label class="block text-xs font-semibold text-percy-text-secondary">Nouveau contexte</label>

    <!-- Name input + submit button -->
    <div class="flex gap-2">
      <input
        v-model="name"
        type="text"
        placeholder="Nom (ex: Cuisine)"
        class="min-w-0 flex-1 rounded-md border border-percy-border-input bg-percy-bg-input px-3 py-2 text-sm text-percy-text-primary placeholder:text-percy-text-muted focus:border-percy-primary focus:outline-none focus:ring-2 focus:ring-percy-primary/30"
        data-testid="todo-context-add-name"
      />
      <button
        type="submit"
        :disabled="!name.trim()"
        class="shrink-0 rounded-md bg-percy-secondary px-4 py-2 text-sm font-bold text-percy-secondary-text transition-colors hover:bg-percy-secondary-hover disabled:opacity-50"
        data-testid="todo-context-add-submit"
      >
        Ajouter
      </button>
    </div>

    <!-- Color picker -->
    <div class="flex flex-wrap items-center gap-2">
      <span class="text-xs text-percy-text-muted">Couleur</span>
      <div class="flex gap-1.5">
        <button
          v-for="c in presetColors"
          :key="c"
          type="button"
          class="h-6 w-6 rounded-full border-2 transition-transform hover:scale-110"
          :class="color === c ? 'border-percy-text-primary scale-110' : 'border-transparent'"
          :style="{ backgroundColor: c }"
          @click="color = c"
        />
      </div>
    </div>
  </form>
</template>
