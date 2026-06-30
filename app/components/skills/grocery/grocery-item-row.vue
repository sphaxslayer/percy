<!--
  grocery-item-row.vue — Single item in the grocery list.
  Shows checkbox, name, quantity/unit, and delete button on hover.
-->
<script setup lang="ts">
import { Pencil, Trash2 } from 'lucide-vue-next';
import { Checkbox } from '~/components/ui/checkbox';
import type { GroceryItem } from '~/types/grocery';

const props = defineProps<{
  item: GroceryItem;
}>();

const emit = defineEmits<{
  toggle: [id: string];
  remove: [id: string];
  edit: [];
}>();

function formatQuantity(item: GroceryItem): string {
  if (item.unit) return `× ${item.quantity} ${item.unit}`;
  if (item.quantity > 1) return `× ${item.quantity}`;
  return '';
}
</script>

<template>
  <div
    class="group flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-percy-bg-page"
    :class="{ 'opacity-50': props.item.checked }"
    :data-testid="`grocery-item-${props.item.id}`"
  >
    <Checkbox
      :model-value="props.item.checked"
      :data-testid="`grocery-checkbox-${props.item.id}`"
      @update:model-value="emit('toggle', props.item.id)"
    />

    <!-- Name + quantity together act as an inline edit trigger. -->
    <button
      type="button"
      class="flex flex-1 items-center gap-2 text-left text-sm"
      :class="{ 'text-percy-text-muted line-through': props.item.checked }"
      :data-testid="`grocery-item-edit-trigger-${props.item.id}`"
      :disabled="props.item.checked"
      @click="emit('edit')"
    >
      <span class="flex-1">{{ props.item.name }}</span>
      <span v-if="formatQuantity(props.item)" class="text-xs text-percy-text-muted">
        {{ formatQuantity(props.item) }}
      </span>
    </button>

    <button
      class="invisible text-percy-text-muted transition-colors hover:text-percy-primary group-hover:visible"
      :data-testid="`grocery-edit-${props.item.id}`"
      :aria-label="`Modifier ${props.item.name}`"
      @click="emit('edit')"
    >
      <Pencil class="h-4 w-4" />
    </button>

    <button
      class="invisible text-percy-text-muted transition-colors hover:text-percy-danger group-hover:visible"
      :data-testid="`grocery-delete-${props.item.id}`"
      @click="emit('remove', props.item.id)"
    >
      <Trash2 class="h-4 w-4" />
    </button>
  </div>
</template>
