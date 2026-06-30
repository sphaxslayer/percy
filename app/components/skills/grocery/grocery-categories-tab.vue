<!--
  grocery-categories-tab.vue — Manage grocery categories: create / rename
  / delete / drag-drop reorder. All actions are offline-resilient via the
  shared queue (parent owns the composable; this component just emits).
-->
<script setup lang="ts">
import { ref } from 'vue';
import { Plus, GripVertical, Pencil, Trash2, Check, X } from 'lucide-vue-next';
import draggable from 'vuedraggable';
import type { GroceryCategory } from '~/types/grocery';

defineProps<{
  categories: GroceryCategory[];
}>();

const emit = defineEmits<{
  add: [name: string];
  rename: [payload: { id: string; name: string }];
  remove: [id: string];
  reorder: [updates: Array<{ id: string; sortOrder: number }>];
}>();

const newName = ref('');
const editingId = ref<string | null>(null);
const editingName = ref('');

function handleAdd() {
  const trimmed = newName.value.trim();
  if (!trimmed) return;
  emit('add', trimmed);
  newName.value = '';
}

function startEdit(cat: GroceryCategory) {
  editingId.value = cat.id;
  editingName.value = cat.name;
}

function confirmEdit() {
  const trimmed = editingName.value.trim();
  if (!trimmed || !editingId.value) {
    editingId.value = null;
    return;
  }
  emit('rename', { id: editingId.value, name: trimmed });
  editingId.value = null;
}

function cancelEdit() {
  editingId.value = null;
}

function handleRemove(cat: GroceryCategory) {
  if (!confirm(`Supprimer la catégorie « ${cat.name} » ?\nLes articles concernés deviendront sans catégorie.`)) return;
  emit('remove', cat.id);
}

function onDragEnd(list: GroceryCategory[]) {
  const updates = list.map((c, idx) => ({ id: c.id, sortOrder: idx }));
  emit('reorder', updates);
}
</script>

<template>
  <div class="space-y-4">
    <!-- Create form -->
    <form class="flex gap-2" data-testid="grocery-category-add-form" @submit.prevent="handleAdd">
      <input
        v-model="newName"
        type="text"
        placeholder="Nouvelle catégorie (Fruits, Légumes…)"
        class="h-10 flex-1 rounded-md border border-percy-border-input bg-percy-bg-input px-3 text-sm text-percy-text-primary placeholder:text-percy-text-muted"
        data-testid="grocery-category-add-input"
      />
      <Button type="submit" size="icon" :disabled="!newName.trim()" data-testid="grocery-category-add-button">
        <Plus class="h-4 w-4" />
      </Button>
    </form>

    <!-- Empty state -->
    <div
      v-if="categories.length === 0"
      class="rounded-lg border border-dashed border-percy-border bg-percy-bg-card p-8 text-center text-sm text-percy-text-muted"
      data-testid="grocery-category-empty"
    >
      Aucune catégorie. Ajoutes-en pour grouper tes courses par rayon.
    </div>

    <!-- Category list (drag-to-reorder) -->
    <draggable
      v-else
      :model-value="categories"
      item-key="id"
      handle=".drag-handle"
      :animation="150"
      ghost-class="opacity-30"
      class="space-y-2"
      @end="onDragEnd(categories)"
    >
      <template #item="{ element: cat }">
        <div
          class="group flex items-center gap-2 rounded-md border border-percy-border bg-percy-bg-card p-2"
          :data-testid="`grocery-category-row-${cat.id}`"
        >
          <button
            class="drag-handle shrink-0 cursor-grab p-1 text-percy-text-muted opacity-50 transition-opacity hover:opacity-100 active:cursor-grabbing"
            aria-label="Réordonner"
            @click.stop
          >
            <GripVertical class="h-4 w-4" />
          </button>

          <!-- Inline edit mode -->
          <template v-if="editingId === cat.id">
            <input
              v-model="editingName"
              type="text"
              class="flex-1 rounded-md border border-percy-border bg-percy-bg-input px-2 py-1 text-sm text-percy-text-primary"
              :data-testid="`grocery-category-edit-input-${cat.id}`"
              @keydown.enter.prevent="confirmEdit"
              @keydown.escape.prevent="cancelEdit"
            />
            <button
              class="rounded-md p-1.5 text-percy-success hover:bg-percy-bg-nav"
              aria-label="Valider"
              @click="confirmEdit"
            >
              <Check class="h-4 w-4" />
            </button>
            <button
              class="rounded-md p-1.5 text-percy-text-muted hover:bg-percy-bg-nav"
              aria-label="Annuler"
              @click="cancelEdit"
            >
              <X class="h-4 w-4" />
            </button>
          </template>

          <!-- Display mode -->
          <template v-else>
            <span class="flex-1 text-sm text-percy-text-primary">{{ cat.name }}</span>
            <button
              class="rounded-md p-1.5 text-percy-text-secondary hover:bg-percy-bg-nav"
              :aria-label="`Renommer ${cat.name}`"
              :data-testid="`grocery-category-edit-${cat.id}`"
              @click="startEdit(cat)"
            >
              <Pencil class="h-4 w-4" />
            </button>
            <button
              class="rounded-md p-1.5 text-percy-danger hover:bg-percy-bg-nav"
              :aria-label="`Supprimer ${cat.name}`"
              :data-testid="`grocery-category-remove-${cat.id}`"
              @click="handleRemove(cat)"
            >
              <Trash2 class="h-4 w-4" />
            </button>
          </template>
        </div>
      </template>
    </draggable>
  </div>
</template>
