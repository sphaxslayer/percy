<!--
  grocery-item-edit-modal.vue — Edit a single grocery item (name, quantity, unit, category).
  Compact modal — used when the user taps the name/details of an active item.
-->
<script setup lang="ts">
import { ref, watch } from 'vue';
import { X } from 'lucide-vue-next';
import type { GroceryItem, GroceryCategory } from '~/types/grocery';

const props = defineProps<{
  open: boolean;
  item: GroceryItem | null;
  categories: GroceryCategory[];
}>();

const emit = defineEmits<{
  close: [];
  save: [
    payload: {
      id: string;
      data: Partial<Pick<GroceryItem, 'name' | 'quantity' | 'unit' | 'categoryId'>>;
    },
  ];
}>();

const name = ref('');
const quantity = ref(1);
const unit = ref('');
const categoryId = ref<string | null>(null);

watch(
  () => props.open,
  (open) => {
    if (!open || !props.item) return;
    name.value = props.item.name;
    quantity.value = props.item.quantity;
    unit.value = props.item.unit ?? '';
    categoryId.value = props.item.categoryId;
  },
);

function handleSave() {
  if (!props.item || !name.value.trim()) return;
  emit('save', {
    id: props.item.id,
    data: {
      name: name.value.trim(),
      quantity: quantity.value,
      unit: unit.value.trim() || null,
      categoryId: categoryId.value,
    },
  });
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open && item"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      data-testid="grocery-item-edit-modal"
      @click.self="emit('close')"
    >
      <div class="w-full max-w-md rounded-lg bg-percy-bg-card shadow-xl">
        <header class="flex items-center justify-between border-b border-percy-border p-4">
          <h2 class="text-base font-semibold text-percy-text-primary">Modifier l'article</h2>
          <button
            class="rounded-md p-1 text-percy-text-muted hover:bg-percy-bg-nav"
            aria-label="Fermer"
            @click="emit('close')"
          >
            <X class="h-5 w-5" />
          </button>
        </header>

        <div class="space-y-3 p-4">
          <div>
            <label class="mb-1 block text-xs font-medium text-percy-text-secondary">Nom *</label>
            <input
              v-model="name"
              type="text"
              class="w-full rounded-md border border-percy-border bg-percy-bg-input px-3 py-2 text-sm text-percy-text-primary"
              data-testid="grocery-item-edit-name"
            />
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="mb-1 block text-xs font-medium text-percy-text-secondary">Quantité</label>
              <input
                v-model.number="quantity"
                type="number"
                min="1"
                class="w-full rounded-md border border-percy-border bg-percy-bg-input px-3 py-2 text-sm text-percy-text-primary"
                data-testid="grocery-item-edit-quantity"
              />
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-percy-text-secondary">Unité</label>
              <input
                v-model="unit"
                type="text"
                placeholder="kg, L, …"
                class="w-full rounded-md border border-percy-border bg-percy-bg-input px-3 py-2 text-sm text-percy-text-primary"
                data-testid="grocery-item-edit-unit"
              />
            </div>
          </div>

          <div>
            <label class="mb-1 block text-xs font-medium text-percy-text-secondary">Catégorie</label>
            <select
              v-model="categoryId"
              class="w-full rounded-md border border-percy-border bg-percy-bg-input px-3 py-2 text-sm text-percy-text-primary"
              data-testid="grocery-item-edit-category"
            >
              <option :value="null">Sans catégorie</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </option>
            </select>
          </div>
        </div>

        <footer class="flex justify-end gap-2 border-t border-percy-border p-4">
          <button
            class="rounded-md px-4 py-2 text-sm text-percy-text-secondary hover:bg-percy-bg-nav"
            @click="emit('close')"
          >
            Annuler
          </button>
          <button
            class="rounded-md bg-percy-primary px-4 py-2 text-sm font-medium text-percy-primary-text hover:opacity-90 disabled:opacity-50"
            :disabled="!name.trim()"
            data-testid="grocery-item-edit-save"
            @click="handleSave"
          >
            Enregistrer
          </button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>
