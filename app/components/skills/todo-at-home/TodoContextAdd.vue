<!--
  TodoContextAdd.vue — Inline form to add a new context (room/area).
  Includes color picker and optional illustration picker.
-->
<script setup lang="ts">

const props = defineProps<{
  domainId: string;
}>();

const emit = defineEmits<{
  add: [payload: { domainId: string; name: string; color: string; imageUrl: string | null }];
}>();

const name = ref('');
const color = ref('#F59E0B');
const imageUrl = ref<string | null>(null);
const showImagePicker = ref(false);

const presetColors = [
  '#F59E0B', '#EF4444', '#3B82F6', '#10B981',
  '#8B5CF6', '#F97316', '#EC4899', '#6366F1',
];

function handleImageSelect(url: string | null) {
  imageUrl.value = url;
  showImagePicker.value = false;
}

function handleSubmit() {
  const trimmed = name.value.trim();
  if (!trimmed) return;
  emit('add', { domainId: props.domainId, name: trimmed, color: color.value, imageUrl: imageUrl.value });
  name.value = '';
  imageUrl.value = null;
}
</script>

<template>
  <form
    class="flex flex-col gap-3 rounded-lg border border-dashed border-percy-border bg-percy-bg-card p-3"
    data-testid="todo-context-add"
    @submit.prevent="handleSubmit"
  >
    <!-- Name input + submit -->
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

    <!-- Color swatches + illustration picker -->
    <div class="flex flex-wrap items-center gap-3">
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

      <!-- Illustration picker trigger -->
      <button
        type="button"
        class="flex items-center gap-1.5 rounded-md border border-percy-border bg-percy-bg-card px-2 py-1 text-xs font-medium text-percy-text-secondary transition-colors hover:border-percy-primary/60 hover:text-percy-primary"
        @click="showImagePicker = true"
      >
        <img
          v-if="imageUrl"
          :src="imageUrl"
          alt=""
          class="h-4 w-4 rounded object-cover"
        >
        <span v-else aria-hidden="true">🖼️</span>
        <span>{{ imageUrl ? 'Changer' : 'Illustration' }}</span>
      </button>
    </div>
  </form>

  <!-- Image picker modal — teleported to body to avoid z-index issues -->
  <Teleport to="body">
    <ContextImagePicker
      v-if="showImagePicker"
      :current-image-url="imageUrl"
      :context-name="name"
      @select="handleImageSelect"
      @close="showImagePicker = false"
    />
  </Teleport>
</template>
